import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

for (const envPath of ['src/environments/.env', '.env']) {
  const resolvedPath = resolve(process.cwd(), envPath);

  if (existsSync(resolvedPath)) {
    config({
      path: resolvedPath,
      override: false,
      quiet: true,
    });
  }
}

const databaseUrl =
  process.env['DIRECT_URL'] ??
  process.env['DATABASE_URL'] ??
  'postgresql://postgres:postgres@localhost:5432/vensight_db?schema=public';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: databaseUrl,
  },
});
