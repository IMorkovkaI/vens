import '../src/api/environment/load-env';
import { getBackendRuntimeStatus } from '../src/api/environment/backend-config';

const DATABASE_ENV_NAMES = ['DATABASE_URL', 'DIRECT_URL'] as const;
const SECRET_ENV_NAMES = [
  'SESSION_SECRET',
  'SEEDED_ADMIN_PASSWORD',
  'GROQ_API_KEY',
  'OPENROUTER_API_KEY',
  'GOOGLE_AI_API_KEY',
  'SEARCH_API_KEY',
  'TAVILY_API_KEY',
] as const;

const status = getBackendRuntimeStatus();

console.log('Vensight environment check');
console.log('');
console.log('Database');

for (const envName of DATABASE_ENV_NAMES) {
  const value = process.env[envName]?.trim();

  console.log(`- ${envName}: ${value ? redactDatabaseUrl(value) : 'missing'}`);
}

console.log('');
console.log('Security');

for (const envName of SECRET_ENV_NAMES) {
  const value = process.env[envName]?.trim();

  console.log(`- ${envName}: ${value ? 'configured' : 'missing'}`);
}

console.log(`- TRUST_PROXY: ${process.env['TRUST_PROXY']?.trim() || 'default'}`);

console.log('');
console.log('AI');
console.log(`- selected provider: ${status.ai.selectedProvider}`);

for (const [provider, providerStatus] of Object.entries(status.ai.providers)) {
  const missingText = providerStatus.missingEnv.length
    ? `missing ${providerStatus.missingEnv.join(', ')}`
    : 'ready';

  console.log(`- ${provider}: ${providerStatus.model} (${missingText})`);
}

console.log('');
console.log('Search Discovery');
console.log(`- selected provider: ${status.search.selectedProvider}`);
console.log(`- fallback provider: ${status.search.fallbackProvider ?? 'none'}`);

for (const [provider, providerStatus] of Object.entries(status.search.providers)) {
  const missingText = providerStatus.missingEnv.length
    ? `missing ${providerStatus.missingEnv.join(', ')}`
    : 'ready';

  console.log(`- ${provider}: ${missingText}`);
}

function redactDatabaseUrl(value: string): string {
  try {
    const url = new URL(value);
    const port = url.port || 'default';
    const database = url.pathname.replace(/^\//, '') || 'postgres';
    const pooler = url.searchParams.get('pgbouncer') === 'true' ? ', pgbouncer' : '';

    return `${url.hostname}:${port}/${database}, user ${redactUsername(url.username)}${pooler}`;
  } catch {
    return 'invalid URL';
  }
}

function redactUsername(username: string): string {
  if (!username) {
    return 'missing';
  }

  if (username === 'postgres') {
    return 'postgres';
  }

  if (username.startsWith('postgres.')) {
    return 'postgres.[project-ref]';
  }

  return '[custom-user]';
}
