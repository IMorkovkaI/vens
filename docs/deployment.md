# Deployment

## Naming

- Product copy uses `Vensight`; package, Angular project, build output, containers, and local infrastructure use lowercase `vensight`.
- Existing local infrastructure and the Supabase project may still use `vensight`; this is acceptable and does not need to be renamed before deployment.
- Local PostgreSQL examples use `vensight_db`.

## Docker

The Docker image builds the Angular SSR app and runs the Express server from `dist/vensight/server/server.mjs`.
The app build runs `prisma generate` first because `generated/prisma` is intentionally ignored from git.

```bash
docker build -t vensight .
docker run --rm -p 4000:4000 -e PORT=4000 vensight
```

Open `http://localhost:4000`.

Run the full local stack:

```bash
docker compose up --build
```

This starts PostgreSQL, applies migrations, seeds data, builds the SSR/API image, and serves the app at `http://localhost:4000`.

## Vercel + Northflank + Supabase

The intended production split is:

- Vercel: Angular frontend and SSR/public routes.
- Northflank: Node.js API host using the same built server artifact with `API_ONLY=true`.
- Supabase: PostgreSQL.

`vercel.json` contains a placeholder `/api/*` rewrite. Replace `https://REPLACE_WITH_NORTHFLANK_BACKEND_HOST` with the final Northflank public service URL before production traffic uses Vercel:

```json
{
  "source": "/api/(.*)",
  "destination": "https://your-northflank-service-url/api/$1"
}
```

This keeps Angular/browser calls relative to `/api` while Northflank owns backend secrets, Prisma, AI providers, and search providers.

## Northflank API

Northflank should deploy this repo as a Dockerfile-backed service. Keep the start command:

```bash
node dist/vensight/server/server.mjs
```

Required Northflank environment variables:

```bash
NODE_ENV="production"
PORT="4000"
API_ONLY="true"
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
SESSION_SECRET="long-random-production-secret"
SEEDED_ADMIN_EMAIL="imarkovychi@gmail.com"
SEEDED_ADMIN_PASSWORD="long-random-initial-admin-password"
TRUST_PROXY="true"
API_REQUEST_LOGS="true"
ALLOWED_ORIGINS="https://vensight.com,https://your-vercel-project.vercel.app"
PUBLIC_SITE_URL="https://vensight.com"
AI_PROVIDER="mock"
SEARCH_PROVIDER="disabled"
```

Provider variables stay on Northflank only when deliberately enabled:

```bash
GROQ_API_KEY="..."
GROQ_MODEL="llama-3.1-8b-instant"
OPENROUTER_API_KEY="..."
OPENROUTER_MODEL="qwen/qwen-2.5-7b-instruct:free"
GOOGLE_AI_API_KEY="..."
GOOGLE_MODEL="gemini-2.5-flash"
SEARCH_API_KEY="..."
SEARCH_API_ENGINE="google"
SEARCH_FALLBACK_PROVIDER="tavily"
TAVILY_API_KEY="..."
```

Keep `AI_PROVIDER=mock` and `SEARCH_PROVIDER=disabled` unless you are intentionally testing provider calls.

`API_REQUEST_LOGS=true` emits safe structured API request logs with request IDs, response status, duration, IP, signed dashboard role when available, and user agent. It does not log request bodies, bearer tokens, passwords, API keys, database URLs, or provider responses. Production API errors include a request ID in the browser response so Northflank logs can be searched without exposing internals.

## Vercel Frontend

Vercel should not receive database URLs, Prisma credentials, session secrets, or provider API keys. The only required production value expected by the frontend/SSR surface is:

```bash
PUBLIC_SITE_URL="https://vensight.com"
```

If Vercel hosts Angular SSR while Northflank hosts `/api`, set the `/api/*` rewrite in `vercel.json` before testing dashboard flows. If a preview deployment needs API access, add that exact preview origin to Northflank `ALLOWED_ORIGINS`.

Dashboard login on Vercel depends on Northflank being live. The browser calls `/api/auth/login`, Vercel rewrites that request to Northflank, and Northflank validates the user against Supabase/Prisma sessions. If the rewrite still contains the placeholder host, or Northflank is missing `DATABASE_URL`, `DIRECT_URL`, `SESSION_SECRET`, migrations, or a seeded/admin account, login will fail even though the public frontend renders.

## Supabase

Before Northflank uses Supabase:

```bash
npm run prisma:migrate:status
npm run prisma:migrate:deploy
npm run supabase:rls:enable
npm run supabase:rls:check
```

Run `npm run prisma:seed` only when intentionally creating or refreshing seed data. The discovery queue table comes from `prisma/migrations/20260524080000_add_discovery_candidates`; it is only needed if the optional queue endpoints are used.

Configure Supabase backups and test at least one restore before exposing real users.

## Production Smoke Checklist

After deployment, verify:

- `GET /` renders the public homepage.
- `GET /companies` renders listings.
- `GET /dashboard/login` renders dashboard login.
- `GET /api/health` returns `status: ok` and `service: vensight-api` without exposing runtime/provider details.
- Login works for the intended admin account.
- Protected listing create/edit works for admin/developer roles.
- `POST /api/ai/provider-check` works for the selected provider and does not create listings.
- `GET /sitemap.xml` uses `https://vensight.com` URLs.
- `GET /robots.txt` blocks `/dashboard` and `/api`.
- Browser network requests call `/api/*` on Vercel and are rewritten to Northflank.

## Remaining Production Work

- Set a strong `SEEDED_ADMIN_PASSWORD` before production seeding, or replace seeded admin with an invite/onboarding flow.
- Token refresh is implemented for bearer sessions. Consider a later HttpOnly cookie migration or shorter TTLs before larger-scale real-user traffic.
- Add CI later for `typecheck`, `test`, `prisma:validate`, and `build`.
- Add Jasmine/Karma later if Angular browser-runner parity is still desired.
- Structured Northflank-friendly request/error logs are implemented. Add hosted error monitoring later if traffic grows beyond manual log review.
- Finalize seeded companies/categories, Open Graph imagery, and launch copy.
