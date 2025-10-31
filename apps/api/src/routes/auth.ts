import type { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';

import { errorResponses } from '../plugins/errors';
import {
  clearRefreshCookie,
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshTokens,
  registerUser,
} from '../controllers/auth.controller';
import {
  AuthResponseSchema,
  AuthUserSchema,
  LoginBodySchema,
  LogoutResponseSchema,
  RegisterBodySchema,
  type AuthResponse,
  type AuthUser,
  type LoginBody,
  type LogoutResponse,
  type RegisterBody,
} from '../schemas/auth.schema';

export async function authRoutes(app: FastifyInstance) {
  app.addSchema(AuthUserSchema);
  app.addSchema(AuthResponseSchema);
  app.addSchema(RegisterBodySchema);
  app.addSchema(LoginBodySchema);
  app.addSchema(LogoutResponseSchema);

  app.post<{ Body: RegisterBody; Reply: AuthResponse }>(
    '/api/auth/register',
    {
      schema: {
        tags: ['auth'],
        summary: 'Register user',
        operationId: 'register',
        body: Type.Ref(RegisterBodySchema),
        response: {
          201: Type.Ref(AuthResponseSchema),
          ...errorResponses,
        },
      },
    },
    async (req, reply) => {
      const result = await registerUser(req, reply);
      if (result.status === 'conflict') {
        throw app.httpErrors.conflict('User already exists');
      }

      return reply.code(201).send(result.data);
    },
  );

  app.post<{ Body: LoginBody; Reply: AuthResponse }>(
    '/api/auth/login',
    {
      schema: {
        tags: ['auth'],
        summary: 'Login user',
        operationId: 'login',
        body: Type.Ref(LoginBodySchema),
        response: {
          200: Type.Ref(AuthResponseSchema),
          ...errorResponses,
        },
      },
    },
    async (req, reply) => {
      const result = await loginUser(req, reply);
      if (result.status === 'invalidCredentials') {
        throw app.httpErrors.unauthorized('Invalid credentials');
      }

      return reply.send(result.data);
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
          200: Type.Ref(AuthResponseSchema),
          ...errorResponses,
        },
      },
    },
    async (req, reply) => {
      const result = await refreshTokens(req, reply);

      switch (result.status) {
        case 'missing':
          throw app.httpErrors.unauthorized('Refresh token missing');
        case 'notFound':
          clearRefreshCookie(reply);
          throw app.httpErrors.unauthorized('Refresh session not found');
        case 'expired':
          clearRefreshCookie(reply);
          throw app.httpErrors.unauthorized('Refresh token expired');
        case 'lifetimeLimit':
          clearRefreshCookie(reply);
          throw app.httpErrors.unauthorized('Refresh token lifetime limit reached');
        case 'invalid':
          clearRefreshCookie(reply);
          throw app.httpErrors.unauthorized('Invalid or expired refresh token');
        case 'ok':
          return reply.send(result.data);
        default: {
          // Exhaustive check
          const _exhaustive: never = result;
          return _exhaustive;
        }
      }
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
          200: Type.Ref(LogoutResponseSchema),
          ...errorResponses,
        },
      },
    },
    async (req, reply) => {
      const result = await logoutUser(req, reply);
      return reply.send(result);
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
          200: Type.Ref(AuthUserSchema),
          ...errorResponses,
        },
        security: [{ bearerAuth: [] }],
      },
    },
    async (req) => {
      const user = await getCurrentUser(req.user.sub);
      if (!user) {
        throw app.httpErrors.notFound('User not found');
      }

      return user;
    },
  );
}
