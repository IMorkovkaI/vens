import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config } from 'dotenv';

const ENV_PATHS = [
  'src/environments/.env',
  '.env',
];

for (const envPath of ENV_PATHS) {
  const resolvedPath = resolve(process.cwd(), envPath);

  if (existsSync(resolvedPath)) {
    config({
      path: resolvedPath,
      override: false,
      quiet: true,
    });
  }
}
