import type { User } from '@prisma/client';
import type { AuthUser } from '../schemas/auth.schema';

export const toAuthUser = (user: User): AuthUser => ({
  id: user.id,
  email: user.email,
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString(),
});
