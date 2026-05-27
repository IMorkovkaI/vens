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

`vercel.json` contains the `/api/*` rewrite to the Northflank public service URL:

```json
{
  "source": "/api/(.*)",
  "destination": "https://your-northflank-service-url/api/$1"
}
```

This keeps Angular/browser calls relative to `/api` while Northflank owns backend secrets, Prisma, AI providers, search providers, and HttpOnly dashboard session cookies.

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
ALLOWED_ORIGINS="https://vensight-phi.vercel.app,https://your-vercel-project.vercel.app"
PUBLIC_SITE_URL="https://vensight-phi.vercel.app"
AI_PROVIDER="groq"
AI_FALLBACK_PROVIDERS="openrouter,google,mock"
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

For an employer-facing demo, use `AI_PROVIDER=groq` with `AI_FALLBACK_PROVIDERS=openrouter,google,mock` so the live URL analysis path attempts a real backend provider first and still degrades safely. Keep `SEARCH_PROVIDER=disabled` unless you are intentionally testing provider calls or have configured SearchApi/Tavily quota.

`API_REQUEST_LOGS=true` emits safe structured API request logs with request IDs, response status, duration, IP, signed dashboard role when available, and user agent. It does not log request bodies, bearer tokens, passwords, API keys, database URLs, or provider responses. Production API errors include a request ID in the browser response so Northflank logs can be searched without exposing internals.

## Vercel Frontend

Vercel should not receive database URLs, Prisma credentials, session secrets, or provider API keys. The only required production value expected by the frontend/SSR surface is:

```bash
PUBLIC_SITE_URL="https://vensight-phi.vercel.app"
```

If Vercel hosts Angular SSR while Northflank hosts `/api`, set the `/api/*` rewrite in `vercel.json` before testing dashboard flows. If a preview deployment needs API access, add that exact preview origin to Northflank `ALLOWED_ORIGINS`.

Set `PUBLIC_SITE_URL` in Vercel as well as Northflank. Angular SSR uses it for canonical and Open Graph URLs, while the API uses it for sitemap and robots assets. If it is missing, Vensight falls back to the current Vercel production URL instead of an internal localhost render origin.

Dashboard login on Vercel depends on Northflank being live. The browser calls `/api/auth/login`, Vercel rewrites that request to Northflank, and Northflank validates the user against Supabase/Prisma sessions. If Northflank is missing `DATABASE_URL`, `DIRECT_URL`, `SESSION_SECRET`, migrations, or a seeded/admin account, login will fail even though the public frontend renders.

Hosted browser sessions use an HttpOnly `SameSite=Lax` cookie set by the API response. Keep dashboard API calls routed through Vercel `/api/*` rewrites so the cookie remains same-origin from the browser's point of view.

## Supabase

Before Northflank uses Supabase:

```bash
npm run prisma:migrate:status
npm run prisma:migrate:deploy
npm run supabase:rls:enable
npm run supabase:rls:check
```

Run `npm run prisma:seed` only when intentionally creating or refreshing seed data. The discovery queue table comes from `prisma/migrations/20260524080000_add_discovery_candidates`; it is only needed if the optional queue endpoints are used. Registered-user daily limits use `prisma/migrations/20260526015000_add_daily_usage`; deploy it before enabling one-search/one-analysis-per-day contributor access.

Contributor daily limits are enforced per account and with a small hashed-network daily cap to reduce account farming. Admin and developer roles are exempt from those contributor caps.

Configure Supabase backups and test at least one restore before exposing real users.

## Production Smoke Checklist

After deployment, verify:

- `GET /` renders the public homepage.
- `GET /companies` renders listings.
- `GET /dashboard/login` renders dashboard login.
- `GET /api/health` returns `status: ok` and `service: vensight-api` without exposing runtime/provider details.
- Login works for the intended admin account.
- Protected listing create/edit works for admin/developer roles.
- A registered user can run one discovery search and one AI URL analysis per UTC day, but cannot create listings.
- `POST /api/ai/provider-check` works for the selected provider and does not create listings.
- `GET /sitemap.xml` uses `https://vensight-phi.vercel.app` URLs.
- `GET /robots.txt` blocks `/dashboard` and `/api`.
- Browser network requests call `/api/*` on Vercel and are rewritten to Northflank.

## Remaining Production Work

- Set a strong `SEEDED_ADMIN_PASSWORD` before production seeding, or replace seeded admin with an invite/onboarding flow.
- Token refresh is implemented for HttpOnly browser sessions and bearer-compatible API clients. Consider shorter TTLs before larger-scale real-user traffic.
- GitHub Actions CI runs `prisma:validate`, `typecheck`, `test`, and `build`.
- Jasmine/Karma browser-runner parity is implemented for Angular specs; API/server specs remain on Vitest.
- Structured Northflank-friendly request/error logs are implemented. Add hosted error monitoring later if traffic grows beyond manual log review.
- Finalize seeded companies/categories, Open Graph imagery, and launch copy.
