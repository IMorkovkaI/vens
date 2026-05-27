import '../src/api/environment/load-env';
import pg from 'pg';

const PROJECT_TABLES = [
  'Category',
  'Company',
  'User',
  'DailyUsage',
  'Session',
  'AiAnalysisResult',
  'DiscoveryCandidate',
  '_prisma_migrations',
];

async function main(): Promise<void> {
  const connectionString = process.env['DIRECT_URL']?.trim();

  if (!connectionString) {
    throw new Error('DIRECT_URL is required before checking RLS.');
  }

  const client = new pg.Client({ connectionString });

  await client.connect();

  try {
    const result = await client.query<{ tablename: string; rowsecurity: boolean }>(
      `
        select c.relname as tablename, c.relrowsecurity as rowsecurity
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public'
          and c.relname = any($1::text[])
        order by c.relname
      `,
      [PROJECT_TABLES],
    );

    for (const row of result.rows) {
      console.log(`${row.tablename}: ${row.rowsecurity ? 'RLS enabled' : 'RLS disabled'}`);
    }
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'RLS check failed.';

  console.error(message);
  process.exit(1);
});
