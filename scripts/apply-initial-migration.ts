import '../src/api/environment/load-env';
import { createHash, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import pg from 'pg';

const INITIAL_MIGRATION_NAME = '20260513124740_init';
const PROJECT_TABLES = ['AiAnalysisResult', 'Category', 'Company', 'User'];

async function main(): Promise<void> {
  const connectionString = process.env['DIRECT_URL']?.trim();

  if (!connectionString) {
    throw new Error('DIRECT_URL is required before applying migrations.');
  }

  const client = new pg.Client({ connectionString });

  await client.connect();

  try {
    await client.query('BEGIN');
    await ensureMigrationCanBeApplied(client);
    await applyMigrationSql(client);
    await recordMigration(client);
    await client.query('COMMIT');

    console.log(`Applied ${INITIAL_MIGRATION_NAME} and recorded it in _prisma_migrations.`);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

async function ensureMigrationCanBeApplied(client: pg.Client): Promise<void> {
  const existingProjectTables = await client.query<{ table_name: string }>(
    `
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_name = any($1::text[])
      order by table_name
    `,
    [PROJECT_TABLES],
  );

  if (existingProjectTables.rowCount) {
    throw new Error(
      `Refusing to apply initial migration because project tables already exist: ${existingProjectTables.rows
        .map((row) => row.table_name)
        .join(', ')}`,
    );
  }

  await ensureMigrationsTable(client);

  const recordedMigration = await client.query(
    `
      select migration_name
      from "_prisma_migrations"
      where migration_name = $1
      limit 1
    `,
    [INITIAL_MIGRATION_NAME],
  );

  if (recordedMigration.rowCount) {
    throw new Error(`${INITIAL_MIGRATION_NAME} is already recorded in _prisma_migrations.`);
  }
}

async function ensureMigrationsTable(client: pg.Client): Promise<void> {
  await client.query(`
    create table if not exists "_prisma_migrations" (
      "id" varchar(36) primary key not null,
      "checksum" varchar(64) not null,
      "finished_at" timestamptz,
      "migration_name" varchar(255) not null,
      "logs" text,
      "rolled_back_at" timestamptz,
      "started_at" timestamptz not null default now(),
      "applied_steps_count" integer not null default 0
    )
  `);
}

async function applyMigrationSql(client: pg.Client): Promise<void> {
  const migrationSql = readMigrationSql();

  await client.query(migrationSql);
}

async function recordMigration(client: pg.Client): Promise<void> {
  const migrationSql = readMigrationSql();
  const checksum = createHash('sha256').update(migrationSql).digest('hex');

  await client.query(
    `
      insert into "_prisma_migrations" (
        "id",
        "checksum",
        "finished_at",
        "migration_name",
        "logs",
        "rolled_back_at",
        "started_at",
        "applied_steps_count"
      )
      values ($1, $2, now(), $3, null, null, now(), 1)
    `,
    [randomUUID(), checksum, INITIAL_MIGRATION_NAME],
  );
}

function readMigrationSql(): string {
  return readFileSync(
    join(process.cwd(), 'prisma/migrations', INITIAL_MIGRATION_NAME, 'migration.sql'),
    'utf8',
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Initial migration failed.';

  console.error(message);
  process.exit(1);
});
