import type { Request } from 'express';
import type { Role } from '../../../generated/prisma/enums';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

export type AuthenticatedRequest = Request & { user: AuthUser };
