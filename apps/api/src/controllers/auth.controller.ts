import type { FastifyReply, FastifyRequest } from 'fastify';
import { randomBytes, createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';

import { prisma } from '../prisma';
import { env } from '../env';
import type {
  AuthResponse,
  AuthUser,
  LoginBody,
  LogoutResponse,
  RegisterBody,
} from '../schemas/auth.schema';

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

const DAY = 24 * 60 * 60 * 1000;

const toAuthUser = (user: {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}): AuthUser => ({
  id: user.id,
  email: user.email,
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString(),
});

const computeRefreshExpires = (baseCreatedAt: Date) => {
  const nowMs = Date.now();
  const sliding = nowMs + env.refreshTokenTtlDays * DAY;
  const absolute = baseCreatedAt.getTime() + env.refreshAbsoluteMaxDays * DAY;
  return new Date(Math.min(sliding, absolute));
};

const buildSessionData = (params: {
  userId: string;
  tokenHash: string;
  req: FastifyRequest;
  baseCreatedAt: Date;
}) => {
  const { userId, tokenHash, req, baseCreatedAt } = params;
  const expiresAt = computeRefreshExpires(baseCreatedAt);
  const data = {
    userId,
    tokenHash,
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip,
    createdAt: baseCreatedAt,
    expiresAt,
  };
  return { data, expiresAt };
};

const setRefreshCookie = (reply: FastifyReply, token: string, expiresAt: Date) => {
  const now = Date.now();
  const maxAgeSeconds = Math.max(0, Math.floor((expiresAt.getTime() - now) / 1000));

  reply.setCookie(env.refreshCookieName, token, {
    path: '/api/auth',
    httpOnly: true,
    sameSite: 'lax',
    secure: env.cookieSecure,
    maxAge: maxAgeSeconds,
    expires: new Date(now + maxAgeSeconds * 1000),
    ...(env.cookieDomain ? { domain: env.cookieDomain } : {}),
  });
};

export const clearRefreshCookie = (reply: FastifyReply) => {
  reply.clearCookie(env.refreshCookieName, {
    path: '/api/auth',
    httpOnly: true,
    sameSite: 'lax',
    secure: env.cookieSecure,
    ...(env.cookieDomain ? { domain: env.cookieDomain } : {}),
  });
};

const createSession = async (
  reply: FastifyReply,
  userId: string,
  token: string,
  req: FastifyRequest,
  opts?: { createdAt?: Date },
) => {
  const tokenHash = hashToken(token);
  const now = new Date();

  const baseCreatedAt = opts?.createdAt ?? now;
  const { data, expiresAt } = buildSessionData({
    userId,
    tokenHash,
    req,
    baseCreatedAt,
  });

  if (expiresAt.getTime() <= now.getTime()) {
    throw new Error('Refresh token lifetime limit reached');
  }

  await prisma.refreshSession.create({ data });
  setRefreshCookie(reply, token, expiresAt);
};

const issueTokens = async (
  req: FastifyRequest,
  reply: FastifyReply,
  user: { id: string; email: string; createdAt: Date; updatedAt: Date },
): Promise<AuthResponse> => {
  const accessToken = await reply.jwtSign({ sub: user.id, email: user.email });
  const refreshToken = randomBytes(48).toString('hex');

  await createSession(reply, user.id, refreshToken, req);

  return {
    accessToken,
    user: toAuthUser(user),
  };
};

export type RegisterResult =
  | { status: 'conflict' }
  | { status: 'ok'; data: AuthResponse };

export const registerUser = async (
  req: FastifyRequest<{ Body: RegisterBody }>,
  reply: FastifyReply,
): Promise<RegisterResult> => {
  const existing = await prisma.user.findUnique({ where: { email: req.body.email } });
  if (existing) {
    return { status: 'conflict' };
  }

  const passwordHash = await bcrypt.hash(req.body.password, 10);
  const user = await prisma.user.create({
    data: { email: req.body.email, passwordHash },
  });

  const data = await issueTokens(req, reply, user);
  return { status: 'ok', data };
};

export type LoginResult =
  | { status: 'invalidCredentials' }
  | { status: 'ok'; data: AuthResponse };

export const loginUser = async (
  req: FastifyRequest<{ Body: LoginBody }>,
  reply: FastifyReply,
): Promise<LoginResult> => {
  const user = await prisma.user.findUnique({ where: { email: req.body.email } });
  if (!user) {
    return { status: 'invalidCredentials' };
  }

  const valid = await bcrypt.compare(req.body.password, user.passwordHash);
  if (!valid) {
    return { status: 'invalidCredentials' };
  }

  const data = await issueTokens(req, reply, user);
  return { status: 'ok', data };
};

export type RefreshResult =
  | { status: 'missing' }
  | { status: 'notFound' }
  | { status: 'expired' }
  | { status: 'lifetimeLimit' }
  | { status: 'invalid' }
  | { status: 'ok'; data: AuthResponse };

export const refreshTokens = async (
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<RefreshResult> => {
  const token = req.cookies[env.refreshCookieName];
  if (!token) {
    return { status: 'missing' };
  }

  const tokenHash = hashToken(token);
  const session = await prisma.refreshSession.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session) {
    return { status: 'notFound' };
  }

  if (session.expiresAt < new Date()) {
    await prisma.refreshSession.deleteMany({ where: { id: session.id } });
    return { status: 'expired' };
  }

  const newRefreshToken = randomBytes(48).toString('hex');
  const newTokenHash = hashToken(newRefreshToken);
  const { data: newSessionData, expiresAt: newExpiresAt } = buildSessionData({
    userId: session.userId,
    tokenHash: newTokenHash,
    req,
    baseCreatedAt: session.createdAt,
  });

  if (newExpiresAt.getTime() <= Date.now()) {
    return { status: 'lifetimeLimit' };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.refreshSession.create({ data: newSessionData });
      try {
        await tx.refreshSession.delete({ where: { id: session.id } });
      } catch (err: unknown) {
        if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025')) {
          throw err;
        }
      }
    });
  } catch {
    return { status: 'invalid' };
  }

  setRefreshCookie(reply, newRefreshToken, newExpiresAt);

  const accessToken = await reply.jwtSign({ sub: session.user.id, email: session.user.email });

  return {
    status: 'ok',
    data: { accessToken, user: toAuthUser(session.user) },
  };
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

  return { ok: true as const };
};

export const getCurrentUser = async (userId: string): Promise<AuthUser | null> => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  return toAuthUser(user);
};
