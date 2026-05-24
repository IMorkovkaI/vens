import '../src/api/environment/load-env';
import pg from 'pg';

const PROJECT_TABLES = [
  'Category',
  'Company',
  'User',
  'Session',
  'AiAnalysisResult',
  'DiscoveryCandidate',
  '_prisma_migrations',
];

async function main(): Promise<void> {
  const connectionString = process.env['DIRECT_URL']?.trim();

  if (!connectionString) {
    throw new Error('DIRECT_URL is required before enabling RLS.');
  }

  const client = new pg.Client({ connectionString });

  await client.connect();

  try {
    await client.query('BEGIN');
    await assertTablesExist(client);

    for (const tableName of PROJECT_TABLES) {
      await client.query(`alter table "${tableName}" enable row level security`);
    }

    await client.query('COMMIT');

    console.log(`Enabled row level security on ${PROJECT_TABLES.length} public tables.`);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

async function assertTablesExist(client: pg.Client): Promise<void> {
  const existingTables = await client.query<{ table_name: string }>(
    `
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_name = any($1::text[])
    `,
    [PROJECT_TABLES],
  );
  const existingTableNames = new Set(existingTables.rows.map((row) => row.table_name));
  const missingTableNames = PROJECT_TABLES.filter((tableName) => !existingTableNames.has(tableName));

  if (missingTableNames.length) {
    throw new Error(
      `Cannot enable RLS because these tables are missing: ${missingTableNames.join(', ')}`,
    );
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'RLS setup failed.';

  console.error(message);
  process.exit(1);
});
