import type { FastifyReply, FastifyRequest } from 'fastify';
import { randomBytes, createHash } from 'node:crypto';
import type { RefreshSession, User } from '@prisma/client';
import { Prisma } from '@prisma/client';

import { prisma } from '../prisma';
import { env } from '../env';
import type { AuthResponse } from '../schemas/auth.schema';
import { toAuthUser } from '../mappers/auth.mapper';

export class RefreshLifetimeExceededError extends Error {
  constructor() {
    super('Refresh token lifetime limit reached');
  }
}

export class RefreshTokenInvalidError extends Error {
  constructor() {
    super('Invalid or expired refresh token');
  }
}

export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

const DAY = 24 * 60 * 60 * 1000;

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

export const setRefreshCookie = (reply: FastifyReply, token: string, expiresAt: Date) => {
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

type CreateSessionParams = {
  reply: FastifyReply;
  userId: string;
  token: string;
  req: FastifyRequest;
  createdAt?: Date;
};

export const createSession = async ({
  reply,
  userId,
  token,
  req,
  createdAt,
}: CreateSessionParams) => {
  const tokenHash = hashToken(token);
  const now = new Date();

  const baseCreatedAt = createdAt ?? now;
  const { data, expiresAt } = buildSessionData({
    userId,
    tokenHash,
    req,
    baseCreatedAt,
  });

  if (expiresAt.getTime() <= now.getTime()) {
    throw new RefreshLifetimeExceededError();
  }

  await prisma.refreshSession.create({ data });
  setRefreshCookie(reply, token, expiresAt);
};

type IssueTokensParams = {
  req: FastifyRequest;
  reply: FastifyReply;
  user: Pick<User, 'id' | 'email' | 'createdAt' | 'updatedAt'>;
};

export const issueTokens = async ({ req, reply, user }: IssueTokensParams): Promise<AuthResponse> => {
  const accessToken = await reply.jwtSign({ sub: user.id, email: user.email });
  const refreshToken = randomBytes(48).toString('hex');

  await createSession({ reply, userId: user.id, token: refreshToken, req });

  return {
    accessToken,
    user: toAuthUser(user),
  };
};

type RefreshSessionWithUser = RefreshSession & { user: User };

export const rotateRefreshSession = async (
  session: RefreshSessionWithUser,
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<AuthResponse> => {
  const newRefreshToken = randomBytes(48).toString('hex');
  const newTokenHash = hashToken(newRefreshToken);
  const { data: newSessionData, expiresAt: newExpiresAt } = buildSessionData({
    userId: session.userId,
    tokenHash: newTokenHash,
    req,
    baseCreatedAt: session.createdAt,
  });

  if (newExpiresAt.getTime() <= Date.now()) {
    throw new RefreshLifetimeExceededError();
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
    throw new RefreshTokenInvalidError();
  }

  setRefreshCookie(reply, newRefreshToken, newExpiresAt);

  const accessToken = await reply.jwtSign({ sub: session.user.id, email: session.user.email });
  return {
    accessToken,
    user: toAuthUser(session.user),
  };
};
