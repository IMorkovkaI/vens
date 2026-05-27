# Database

This slice adds the first Prisma/PostgreSQL contract and wires the directory, auth, and AI analysis cache API endpoints to Prisma when `DATABASE_URL` is configured. Without `DATABASE_URL`, the app keeps using in-memory mock stores so local frontend work remains dependency-light.

## Schema

The Prisma schema lives in `prisma/schema.prisma`, with connection configuration in `prisma.config.ts` for Prisma 7 compatibility. In Prisma 7, `url`, `directUrl`, and `shadowDatabaseUrl` should not be added to `schema.prisma`; connection URLs are resolved through Prisma Config instead. Generated Prisma Client output goes to `generated/prisma` so Angular app compilation does not treat generated database code as browser source. It models:

- `Category`
- `Company`
- `User`
- `Session`
- `AiAnalysisResult`
- `DashboardRole`
- `AiProvider`

The schema keeps AI output cacheable through `AiAnalysisResult.generatedData`, while preserving queryable fields such as `url`, `hostname`, `provider`, `model`, `confidence`, and the optional linked `companyId`. Dashboard login sessions are persisted in `Session` as hashed bearer tokens with expiry and optional revocation metadata.

## Local Environment

Use `src/environments/.env.example` as the reference for database-backed runtime variables:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/vensight_db?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/vensight_db?schema=public"
SESSION_SECRET="change-this-local-session-secret"
AI_PROVIDER="mock"
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="qwen2.5:7b"
```

Do not commit real `.env` files. The API and Prisma CLI load `src/environments/.env` first, then root `.env` as a local fallback. Prisma CLI commands use `DIRECT_URL` when present, then `DATABASE_URL`, then the local default from `prisma.config.ts`. Runtime Prisma Client uses `DATABASE_URL`.

## Supabase Connection Setup

For Supabase, keep the runtime and migration URLs separate:

```bash
# Runtime Prisma Client connection. Use Supabase transaction pooler for serverless/auto-scaling hosts.
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Prisma CLI migrations/introspection. Use Supabase direct DB URL or session pooler.
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

For a long-running backend host, Supabase session pooler on port `5432` can also be used for `DATABASE_URL`. For serverless or auto-scaling deployment, prefer transaction pooler on port `6543` for runtime and keep `DIRECT_URL` for Prisma CLI workflows.

### Supabase P1000 checklist

If `npm run prisma:migrate:status` returns `P1000: Authentication failed`, check:

- For Supabase pooler hosts (`*.pooler.supabase.com`) on ports `6543` or `5432`, the username should usually be `postgres.[PROJECT-REF]`.
- For direct hosts (`db.[PROJECT-REF].supabase.co`) on port `5432`, the username is usually `postgres`.
- The database password is the Supabase database password, not the Supabase dashboard login password.
- URL-encode special characters in the password before putting it into `DATABASE_URL` or `DIRECT_URL`.
- Run `npm run env:check` and confirm the redacted host, port, database name, and username shape match the intended Supabase connection.

## Commands

Validate the schema:

```bash
npm run prisma:validate
```

Generate the Prisma Client:

```bash
npm run prisma:generate
```

Run migrations once a local PostgreSQL database is available:

```bash
npm run prisma:migrate:dev
```

Check migration status before touching a remote Supabase database:

```bash
npm run prisma:migrate:status
```

Apply existing migrations in a deployment or remote database environment:

```bash
npm run prisma:migrate:deploy
```

If Prisma's schema engine fails against the Supabase pooler but `npm run env:check` and a direct PostgreSQL connection are valid, the project includes a guarded fallback for the initial empty database only:

```bash
npm run supabase:apply-initial-migration
```

This fallback refuses to run if Vensight tables already exist or if the initial migration is already recorded.

Enable row level security for Supabase public-table warnings:

```bash
npm run supabase:rls:enable
npm run supabase:rls:check
```

The current backend uses server-side Prisma only, so no public Supabase anon policies are added. RLS is enabled to keep browser/anon access closed while database-authenticated backend operations continue to work. Re-run these commands after migrations that add public tables.

Seed the database with the current mock categories, companies, and configured seeded admin account. Set `SEEDED_ADMIN_PASSWORD` before seeding any shared or production database:

```bash
npm run prisma:seed
```

## Current Integration

Directory reads, writes, category listings, directory analytics, auth login, registration, developer management, auth session validation, and AI analysis cache lookups now resolve through repository boundaries:

- `DATABASE_URL` absent: use in-memory mock repositories.
- `DATABASE_URL` present: use Prisma/PostgreSQL as the authoritative backend for implemented repositories.
- Prisma operation failure: return an API error rather than falling back to memory.

Prisma-backed auth stores hashed passwords using a Node.js scrypt hash format and validates protected API requests against hashed, expiring `Session` rows. Bearer sessions can be refreshed, and Prisma-backed refresh revokes the previous session token hash before issuing the replacement. Prisma-backed AI analysis stores generated profile payloads and source metadata in `AiAnalysisResult.generatedData` by normalized URL, regardless of which configured provider generated the result.

## Future Integration

The next database slices should:

- add migrations
- consider HttpOnly cookie sessions or shorter token TTLs before larger-scale real-user traffic

## Repository Foundation

The Prisma-backed directory repository lives in `src/api/database/prisma-directory.repository.ts`. It mirrors the development directory store contract for categories, companies, search/filter, create/edit listing, and analytics.

The Prisma-backed AI analysis cache repository lives in `src/api/database/prisma-ai-analysis-cache.repository.ts`. It persists content-aware AI analysis results by normalized HTTPS URL and remains backward-compatible with older cache entries that only stored generated form data.

`src/api/database/prisma.client.ts` creates Prisma Client lazily with the PostgreSQL adapter from `@prisma/adapter-pg`. Any route that imports and instantiates a Prisma repository will require `DATABASE_URL`.
