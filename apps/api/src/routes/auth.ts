import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { Type, type Static } from '@sinclair/typebox';
import bcrypt from 'bcryptjs';
import { randomBytes, createHash } from 'node:crypto';

import { prisma } from '../prisma';
import { env } from '../env';
import { errorResponses } from '../plugins/errors';
import { Prisma } from '@prisma/client';

const UserSchema = Type.Object(
  {
    id: Type.String({ minLength: 1 }),
    email: Type.String({ format: 'email' }),
    createdAt: Type.String({ format: 'date-time' }),
    updatedAt: Type.String({ format: 'date-time' }),
  },
  { $id: 'AuthUser', additionalProperties: false },
);

const AuthResponseSchema = Type.Object(
  {
    accessToken: Type.String({ minLength: 1 }),
    user: UserSchema,
  },
  { $id: 'AuthResponse', additionalProperties: false },
);

type AuthUser = Static<typeof UserSchema>;

type AuthResponse = Static<typeof AuthResponseSchema>;

const RegisterBodySchema = Type.Object(
  {
    email: Type.String({ format: 'email' }),
    password: Type.String({ minLength: 8, description: 'Минимум 8 символов' }),
  },
  { additionalProperties: false },
);

type RegisterBody = Static<typeof RegisterBodySchema>;

const LoginBodySchema = Type.Object(
  {
    email: Type.String({ format: 'email' }),
    password: Type.String({ minLength: 1 }),
  },
  { additionalProperties: false },
);

type LoginBody = Static<typeof LoginBodySchema>;

const LogoutResponseSchema = Type.Object(
  { ok: Type.Literal(true) },
  { additionalProperties: false },
);

type LogoutResponse = Static<typeof LogoutResponseSchema>;

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const toUser = (user: {
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

// ★ helper: единообразно считаем expiresAt от базовой даты рождения refresh-сессии
const computeRefreshExpires = (baseCreatedAt: Date) => {
  const nowMs = Date.now();
  const sliding = nowMs + env.refreshTokenTtlDays * DAY;
  const absolute = baseCreatedAt.getTime() + env.refreshAbsoluteMaxDays * DAY;
  return new Date(Math.min(sliding, absolute));
};

// ★ builder: формирует payload для Prisma и возвращает expiresAt для cookie/проверок
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

/** Устанавливаем refresh-cookie до конкретного expiresAt, а не на полный TTL */
const setRefreshCookie = (reply: FastifyReply, token: string, expiresAt: Date) => {
  const now = Date.now();
  const maxAgeSeconds = Math.max(0, Math.floor((expiresAt.getTime() - now) / 1000));

  reply.setCookie(env.refreshCookieName, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: env.cookieSecure,
    maxAge: maxAgeSeconds,
    expires: new Date(now + maxAgeSeconds * 1000),
    ...(env.cookieDomain ? { domain: env.cookieDomain } : {}),
  });
};

const clearRefreshCookie = (reply: FastifyReply) => {
  reply.clearCookie(env.refreshCookieName, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: env.cookieSecure,
    ...(env.cookieDomain ? { domain: env.cookieDomain } : {}),
  });
};

/**
 * Создаёт refresh-сессию с учётом:
 *  - скользящего окна (env.refreshTokenTtlDays)
 *  - абсолютного потолка (env.refreshAbsoluteMaxDays) от baseCreatedAt
 *
 * Если потолок уже истёк — бросает ошибку (хендлер превратит её в 401).
 */
const createSession = async (
  reply: FastifyReply,
  userId: string,
  token: string,
  req: FastifyRequest,
  opts?: { createdAt?: Date }, // при ротации прокидываем исходный createdAt
) => {
  const tokenHash = hashToken(token);
  const now = new Date();

  const baseCreatedAt = opts?.createdAt ?? now; // первый логин: now; ротация: исходный createdAt
  const { data, expiresAt } = buildSessionData({
    userId,
    tokenHash,
    req,
    baseCreatedAt,
  }); // ★ используем builder

  if (expiresAt.getTime() <= now.getTime()) {
    // потолок пройден — запрещаем создание новой сессии
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
    user: toUser(user),
  };
};

export async function authRoutes(app: FastifyInstance) {
  app.addSchema(UserSchema);
  app.addSchema(AuthResponseSchema);

  app.post<{ Body: RegisterBody; Reply: AuthResponse }>(
    '/api/auth/register',
    {
      schema: {
        tags: ['auth'],
        summary: 'Register user',
        operationId: 'register',
        body: RegisterBodySchema,
        response: {
          201: AuthResponseSchema,
          ...errorResponses,
        },
      },
    },
    async (req, reply) => {
      const existing = await prisma.user.findUnique({ where: { email: req.body.email } });
      if (existing) {
        throw app.httpErrors.conflict('User already exists');
      }

      const passwordHash = await bcrypt.hash(req.body.password, 10);
      const user = await prisma.user.create({
        data: { email: req.body.email, passwordHash },
      });

      const result = await issueTokens(req, reply, user);
      return reply.code(201).send(result);
    },
  );

  app.post<{ Body: LoginBody; Reply: AuthResponse }>(
    '/api/auth/login',
    {
      schema: {
        tags: ['auth'],
        summary: 'Login user',
        operationId: 'login',
        body: LoginBodySchema,
        response: {
          200: AuthResponseSchema,
          ...errorResponses,
        },
      },
    },
    async (req, reply) => {
      const user = await prisma.user.findUnique({ where: { email: req.body.email } });
      if (!user) {
        throw app.httpErrors.unauthorized('Invalid credentials');
      }

      const valid = await bcrypt.compare(req.body.password, user.passwordHash);
      if (!valid) {
        throw app.httpErrors.unauthorized('Invalid credentials');
      }

      const result = await issueTokens(req, reply, user);
      return reply.send(result);
    },
  );

  app.post<{ Reply: AuthResponse }>(
    '/api/auth/refresh',
    {
      schema: {
        tags: ['auth'],
        summary: 'Refresh access token',
        operationId: 'refresh',
        response: {
          200: AuthResponseSchema,
          ...errorResponses,
        },
      },
    },
    async (req, reply) => {
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

      // ★ Транзакционная ротация refresh: сначала создать новую, затем удалить старую
      const newRefreshToken = randomBytes(48).toString('hex'); // новый секрет
      const newTokenHash = hashToken(newRefreshToken);
      const { data: newSessionData, expiresAt: newExpiresAt } = buildSessionData({
        userId: session.userId,
        tokenHash: newTokenHash,
        req,
        baseCreatedAt: session.createdAt, // сохраняем базовую дату рождения сессии
      });

      if (newExpiresAt.getTime() <= Date.now()) {
        // потолок уже достигнут: чистим куку и 401 (редкий, но возможный случай до исчезновения cookie на клиенте)
        clearRefreshCookie(reply);
        throw app.httpErrors.unauthorized('Refresh token lifetime limit reached');
      }

      try {
        await prisma.$transaction(async (tx) => {
          await tx.refreshSession.create({ data: newSessionData });
          // Если параллельный запрос удалил старую запись — игнорируем "record not found"
          try {
            await tx.refreshSession.delete({ where: { id: session.id } });
          } catch (err: unknown) {
            if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025')) {
              throw err; // всё, что не P2025, пробрасываем дальше
            }
          }
        });
      } catch {
        clearRefreshCookie(reply);
        throw app.httpErrors.unauthorized('Invalid or expired refresh token');
      }

      // ★ выставляем cookie под тот же expiresAt, что в БД
      setRefreshCookie(reply, newRefreshToken, newExpiresAt);

      const accessToken = await reply.jwtSign({ sub: session.user.id, email: session.user.email });

      return reply.send({ accessToken, user: toUser(session.user) });
    },
  );

  app.post<{ Reply: LogoutResponse }>(
    '/api/auth/logout',
    {
      schema: {
        tags: ['auth'],
        summary: 'Logout user',
        operationId: 'logout',
        response: {
          200: LogoutResponseSchema,
          ...errorResponses,
        },
      },
    },
    async (req, reply) => {
      const token = req.cookies[env.refreshCookieName];
      if (token) {
        const tokenHash = hashToken(token);
        await prisma.refreshSession.deleteMany({ where: { tokenHash } });
      }

      clearRefreshCookie(reply);

      return reply.send({ ok: true as const });
    },
  );

  app.get<{ Reply: AuthUser }>(
    '/api/auth/me',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['auth'],
        summary: 'Get current user',
        operationId: 'getCurrentUser',
        response: {
          200: UserSchema,
          ...errorResponses,
        },
        security: [{ bearerAuth: [] }],
      },
    },
    async (req) => {
      const user = await prisma.user.findUnique({ where: { id: req.user.sub } });
      if (!user) {
        throw app.httpErrors.notFound('User not found');
      }

      return toUser(user);
    },
  );
}
