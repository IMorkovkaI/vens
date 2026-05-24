import '../environment/load-env';
import { PrismaClient } from '../../../generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';

let prisma: PrismaClient | undefined;

export function getPrismaClient(): PrismaClient {
  if (prisma) {
    return prisma;
  }

  const databaseUrl = process.env['DATABASE_URL'];

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required before using Prisma repositories.');
  }

  const adapter = new PrismaPg({ connectionString: databaseUrl });
  prisma = new PrismaClient({ adapter });

  return prisma;
}
