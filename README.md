# Vensight

Vensight is an Angular SSR business directory with a Node.js API, Prisma/PostgreSQL persistence, dashboard listing tools, and AI-assisted company analysis.

## Current MVP

- Public homepage, company listing, category pages, company detail pages, compare page, legal pages, and data-source notes.
- Dashboard authentication with user, developer, and admin roles.
- Admin/developer listing create and edit flow.
- Content-aware HTTPS URL analysis with mock, Ollama, Groq, OpenRouter, and Google provider abstractions.
- Prisma-backed directory, auth sessions, AI analysis cache, and optional discovery candidate storage.
- Search discovery is available behind `SEARCH_PROVIDER=searchapi` or `tavily`, but stays disabled by default.

## Requirements

- Node.js 24.14
- npm 11.9
- PostgreSQL for persistent local development, or Supabase for hosted PostgreSQL
- Optional Docker Desktop for one-command local stack startup
- Optional Ollama and Qwen2.5 7B for local AI testing

## Environment

Copy the example env file and fill in local values:

```bash
copy src\environments\.env.example src\environments\.env
```

The app loads `src/environments/.env` first. Keep real `.env` files out of git.

Local PostgreSQL examples use `vensight_db`. Product copy uses `Vensight`; package, Angular project, build output, containers, and local infrastructure use lowercase `vensight`.

Check configuration without printing secrets:

```bash
npm run env:check
```

## Local Development

Install dependencies:

```bash
npm install
```

Validate Prisma:

```bash
npm run prisma:validate
```

Apply local migrations and seed data:

```bash
npm run prisma:migrate:dev
npm run prisma:seed
```

Run Angular dev server:

```bash
npm start
```

For the built SSR/API server:

```bash
npm run build
npm run serve:ssr:vensight
```

Open `http://localhost:4000`.

## Docker

Run the full local stack:

```bash
docker compose up --build
```

This starts PostgreSQL, applies migrations, seeds data, builds the app, and serves it at `http://localhost:4000`.

Stop the stack:

```bash
docker compose down
```

Reset Docker database volume:

```bash
docker compose down -v
```

## Useful Commands

```bash
npm run typecheck
npm run test
npm run build
npm run prisma:validate
npm run prisma:migrate:status
npm run env:check
npm run supabase:version
```

Supabase CLI workflows are documented in [docs/supabase-cli.md](docs/supabase-cli.md). Prisma migrations remain the app schema source of truth.

## Deployment Shape

The planned production split is:

- Vercel for the Angular frontend/SSR surface.
- Northflank for the Node.js API host.
- Supabase for PostgreSQL.

When splitting frontend and backend, keep provider keys and Prisma credentials on the backend only. Configure Vercel rewrites for `/api/*` once the Northflank backend URL is final.

This repo includes:

- `vercel.json` with a placeholder `/api/*` rewrite.
- Dockerfile-based backend deployment for Northflank with `/api/health` checks.
- Docker Compose for a local PostgreSQL-backed app stack.

Replace the placeholder Northflank host in `vercel.json` before production traffic uses Vercel.

See [docs/deployment.md](docs/deployment.md) and [docs/manual-setup.md](docs/manual-setup.md) for the current deployment checklist.
