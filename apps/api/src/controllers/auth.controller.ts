import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import bcrypt from 'bcryptjs';

import { prisma } from '../prisma';
import { env } from '../env';
import {
  clearRefreshCookie,
  hashToken,
  issueTokens,
  rotateRefreshSession,
  RefreshLifetimeExceededError,
  RefreshTokenInvalidError,
} from '../services/auth.service';
import type {
  AuthResponse,
  AuthUser,
  LoginBody,
  LogoutResponse,
  RegisterBody,
} from '../schemas/auth.schema';
import { toAuthUser } from '../mappers/auth.mapper';

const mapRefreshError = (app: FastifyInstance, error: unknown): never => {
  if (error instanceof RefreshLifetimeExceededError) {
    throw app.httpErrors.unauthorized('Refresh token lifetime limit reached');
  }

  if (error instanceof RefreshTokenInvalidError) {
    throw app.httpErrors.unauthorized('Invalid or expired refresh token');
  }

  throw error;
};

export const registerUser = async (
  app: FastifyInstance,
  body: RegisterBody,
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<AuthResponse> => {
  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing) {
    throw app.httpErrors.conflict('User already exists');
  }

  const passwordHash = await bcrypt.hash(body.password, 10);
  const user = await prisma.user.create({
    data: { email: body.email, passwordHash },
  });

  try {
    return await issueTokens({ req, reply, user });
  } catch (error) {
    return mapRefreshError(app, error);
  }
};

export const loginUser = async (
  app: FastifyInstance,
  body: LoginBody,
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<AuthResponse> => {
  const user = await prisma.user.findUnique({ where: { email: body.email } });
  if (!user) {
    throw app.httpErrors.unauthorized('Invalid credentials');
  }

  const valid = await bcrypt.compare(body.password, user.passwordHash);
  if (!valid) {
    throw app.httpErrors.unauthorized('Invalid credentials');
  }

  try {
    return await issueTokens({ req, reply, user });
  } catch (error) {
    return mapRefreshError(app, error);
  }
};

export const refreshTokens = async (
  app: FastifyInstance,
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<AuthResponse> => {
  const token = req.cookies[env.refreshCookieName];
  if (!token) {
    throw app.httpErrors.unauthorized('Refresh token missing');
  }

  const tokenHash = hashToken(token);
  const session = await prisma.refreshSession.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session) {
    clearRefreshCookie(reply);
    throw app.httpErrors.unauthorized('Refresh session not found');
  }

  if (session.expiresAt < new Date()) {
    await prisma.refreshSession.deleteMany({ where: { id: session.id } });
    clearRefreshCookie(reply);
    throw app.httpErrors.unauthorized('Refresh token expired');
  }

  try {
    return await rotateRefreshSession(session, req, reply);
  } catch (error) {
    clearRefreshCookie(reply);
    return mapRefreshError(app, error);
  }
};

export const logoutUser = async (
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<LogoutResponse> => {
  const token = req.cookies[env.refreshCookieName];
  if (token) {
    const tokenHash = hashToken(token);
    await prisma.refreshSession.deleteMany({ where: { tokenHash } });
  }

  clearRefreshCookie(reply);

  return { ok: true };
};

export const getCurrentUser = async (
  app: FastifyInstance,
  userId: string,
): Promise<AuthUser> => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw app.httpErrors.notFound('User not found');
  }

  return toAuthUser(user);
};
