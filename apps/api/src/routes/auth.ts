import type { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';

import { errorResponses } from '../plugins/errors';
import {
  AuthResponseSchema,
  AuthUserSchema,
  LoginBodySchema,
  LogoutResponseSchema,
  RegisterBodySchema,
  authSchemas,
  type AuthResponse,
  type AuthUser,
  type LoginBody,
  type LogoutResponse,
  type RegisterBody,
} from '../schemas/auth.schema';
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshTokens,
  registerUser,
} from '../controllers/auth.controller';

export async function authRoutes(app: FastifyInstance) {
  authSchemas.forEach((schema) => app.addSchema(schema));

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
      const result = await registerUser(app, req.body, req, reply);
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
        body: Type.Ref(LoginBodySchema),
        response: {
          200: Type.Ref(AuthResponseSchema),
          ...errorResponses,
        },
      },
    },
    async (req, reply) => {
      const result = await loginUser(app, req.body, req, reply);
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
          200: Type.Ref(AuthResponseSchema),
          ...errorResponses,
        },
      },
    },
    async (req, reply) => {
      const result = await refreshTokens(app, req, reply);
      return reply.send(result);
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
    async (req) => getCurrentUser(app, req.user.sub),
  );
}
