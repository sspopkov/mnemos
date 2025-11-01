import { Type, type Static } from '@sinclair/typebox';

export const SandboxResponseSchema = Type.Object(
  {
    message: Type.String(),
  },
  { $id: 'SandboxResponse', title: 'SandboxResponse', additionalProperties: false },
);

export const SandboxDelayQuerySchema = Type.Object(
  {
    delayMs: Type.Optional(
      Type.Integer({
        minimum: 0,
        maximum: 60000,
        description: 'Искусственная задержка в миллисекундах',
      }),
    ),
  },
  { $id: 'SandboxDelayQuery', title: 'SandboxDelayQuery', additionalProperties: false },
);

export const sandboxSchemas = [SandboxResponseSchema, SandboxDelayQuerySchema] as const;

export type SandboxResponse = Static<typeof SandboxResponseSchema>;
export type SandboxDelayQuery = Static<typeof SandboxDelayQuerySchema>;
