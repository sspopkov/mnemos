import { Type, type Static } from '@sinclair/typebox';

export const SandboxResponseSchema = Type.Object(
  {
    message: Type.String(),
  },
  { $id: 'SandboxResponse', title: 'SandboxResponse', additionalProperties: false },
);

export const sandboxSchemas = [SandboxResponseSchema] as const;

export type SandboxResponse = Static<typeof SandboxResponseSchema>;
