import { Type, type Static } from '@sinclair/typebox';

export const AuthUserSchema = Type.Object(
  {
    id: Type.String({ minLength: 1 }),
    email: Type.String({ format: 'email' }),
    createdAt: Type.String({ format: 'date-time' }),
    updatedAt: Type.String({ format: 'date-time' }),
  },
  { $id: 'AuthUser', title: 'AuthUser', additionalProperties: false },
);

export const AuthResponseSchema = Type.Object(
  {
    accessToken: Type.String({ minLength: 1 }),
    user: Type.Ref(AuthUserSchema),
  },
  { $id: 'AuthResponse', title: 'AuthResponse', additionalProperties: false },
);

export const RegisterBodySchema = Type.Object(
  {
    email: Type.String({ format: 'email' }),
    password: Type.String({ minLength: 8, description: 'Минимум 8 символов' }),
  },
  { $id: 'RegisterRequest', title: 'RegisterRequest', additionalProperties: false },
);

export const LoginBodySchema = Type.Object(
  {
    email: Type.String({ format: 'email' }),
    password: Type.String({ minLength: 1 }),
  },
  { $id: 'LoginRequest', title: 'LoginRequest', additionalProperties: false },
);

export const LogoutResponseSchema = Type.Object(
  { ok: Type.Literal(true) },
  { $id: 'LogoutResponse', title: 'LogoutResponse', additionalProperties: false },
);

export const authSchemas = [
  AuthUserSchema,
  AuthResponseSchema,
  RegisterBodySchema,
  LoginBodySchema,
  LogoutResponseSchema,
] as const;

export type AuthUser = Static<typeof AuthUserSchema>;
export type AuthResponse = Static<typeof AuthResponseSchema>;
export type RegisterBody = Static<typeof RegisterBodySchema>;
export type LoginBody = Static<typeof LoginBodySchema>;
export type LogoutResponse = Static<typeof LogoutResponseSchema>;
