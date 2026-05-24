import { Request } from 'express';
import { DashboardUser } from '../../app/core/auth/auth.models';
import { getPrismaClient } from '../database/prisma.client';
import { hasDatabaseUrl } from '../directory/directory-repository';
import { hashSessionToken, verifySessionToken } from './session-token';

export async function readRequestUser(req: Request): Promise<DashboardUser | undefined> {
  return readBearerTokenUser(req);
}

async function readBearerTokenUser(req: Request): Promise<DashboardUser | undefined> {
  const authorization = req.header('authorization');
  const [scheme, token, extra] = authorization?.split(/\s+/) ?? [];

  if (scheme?.toLowerCase() !== 'bearer' || !token || extra) {
    return undefined;
  }

  const tokenUser = verifySessionToken(token);

  if (!tokenUser || !hasDatabaseUrl()) {
    return tokenUser;
  }

  const session = await getPrismaClient().session.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    select: {
      expiresAt: true,
      revokedAt: true,
      user: {
        select: {
          email: true,
          role: true,
        },
      },
    },
  });

  if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
    return undefined;
  }

  const sessionUser: DashboardUser = {
    email: session.user.email,
    role: session.user.role.toLowerCase() as DashboardUser['role'],
  };

  if (sessionUser.email !== tokenUser.email || sessionUser.role !== tokenUser.role) {
    return undefined;
  }

  return sessionUser;
}
