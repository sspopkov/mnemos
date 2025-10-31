import type { User } from '@prisma/client';
import type { AuthUser } from '../schemas/auth.schema';

type AuthUserSource = Pick<User, 'id' | 'email' | 'createdAt' | 'updatedAt'>;

export const toAuthUser = (user: AuthUserSource): AuthUser => ({
  id: user.id,
  email: user.email,
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString(),
});
