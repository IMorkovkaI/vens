# Manual Setup Checklist

This is the project-level list of things that still need manual setup outside the codebase. Vensight is now set up for the intended production split: Vercel serves the frontend/public SSR routes, Northflank serves `/api`, and Supabase stores Prisma data.

## Local Development

- [x] Install Node.js 24.14 and npm 11.9.
- [x] Run `npm install`.
- [x] Create a local PostgreSQL database, for example `vensight_db`.
- [x] Create a local `src/environments/.env` from `src/environments/.env.example` with real `DATABASE_URL` and `DIRECT_URL` values.
- [x] Run `npm run env:check` to verify backend env presence without printing secrets.
- [x] Set `SESSION_SECRET` locally if you want stable signed dashboard tokens across server restarts.
- [x] Run `npm run prisma:migrate:dev`.
- [x] Run `npm run prisma:seed`.
- [x] Local development setup is complete for the current Vercel + Northflank + Supabase workflow.
- Re-run `npm run prisma:seed` after taxonomy changes when existing databases need newly added categories.
- Re-run `npm run supabase:rls:enable` and `npm run supabase:rls:check` after applying migrations that add public Supabase tables.
- Keep real `.env` files out of git.
- [x] Add Docker Compose for one-command local app + PostgreSQL startup.
- Docker is not available on the current local machine, so skip local Docker validation for now and keep Docker checks for a later environment.

## Supabase

- [x] Create a Supabase project.
- [x] Supabase project may stay named `vensight`; product copy is `Vensight`, and the production domain is configured through Vercel.
- [x] Copy the Supabase runtime connection string into `DATABASE_URL`.
- [x] Copy the Supabase direct database or session pooler connection string into `DIRECT_URL`.
- For serverless/auto-scaling hosts, use Supabase transaction pooler on port `6543` for `DATABASE_URL`.
- [x] Run `npm run env:check` and confirm `DATABASE_URL` and `DIRECT_URL` point at the intended Supabase host.
- [x] Install the Supabase CLI as a local dev dependency and initialize `supabase/config.toml`.
- Link the repo to the Supabase project with `npm run supabase:login` and `npm run supabase:link -- --project-ref <project-ref>`.
- [x] Run `npm run prisma:migrate:status` before touching the Supabase database.
- [x] Run Prisma migrations against Supabase with `npm run prisma:migrate:deploy` after checking that `DIRECT_URL` points at the intended project.
- [x] If Prisma's schema engine fails against the Supabase pooler on an empty database, use `npm run supabase:apply-initial-migration` as the guarded fallback.
- [x] Run `npm run prisma:seed` against Supabase only when you intentionally want the seed admin/categories/companies there.
- [x] Enable RLS on public Vensight tables with `npm run supabase:rls:enable`.
- [x] Confirm RLS status with `npm run supabase:rls:check`.
- [x] Apply the `Session` migration to Supabase, then re-run `npm run supabase:rls:enable` and `npm run supabase:rls:check`.
- [x] Confirm the latest migration `20260526015000_add_daily_usage` is applied before allowing registered users to run daily discovery or AI analysis actions.
- Apply `20260527011000_enable_daily_usage_rls` with `npm run prisma:migrate:deploy`, then run `npm run supabase:rls:check` to confirm `DailyUsage: RLS enabled`.
- Registered contributor access is intentionally limited to one AI URL analysis and one discovery search per account per UTC day, with an additional daily network cap to reduce account-farming abuse.
- Supabase free plan backup path: use physical backups, download/store an encrypted copy outside Supabase, and test a restore into a local or temporary Postgres database before exposing real users.

## Auth And Accounts

- [x] Set `SEEDED_ADMIN_PASSWORD` before seeding any shared or production database.
- Decide whether the seeded admin should stay in seed data or be replaced by an invite/onboarding flow.
- Configure a production-grade `SESSION_SECRET`.
- [x] Add logout/session revocation UI and backend token revocation for Prisma sessions.
- [x] Add bearer session refresh so persisted dashboard sessions rotate and expired sessions are cleared.
- [x] Use HttpOnly `SameSite=Lax` session cookies for hosted browser dashboard sessions so tokens are not persisted in browser `localStorage`.

## AI Providers

- Keep `AI_PROVIDER=mock` for default development.
- [x] Install and run Ollama locally before setting `AI_PROVIDER=ollama`.
- [x] Download the selected local model, currently planned as Qwen2.5 7B.
- [x] Rotate any cloud API keys that were shared in chat, then add the fresh values only to local/deployment env vars.
- [x] Add local/dev `GROQ_API_KEY`, `OPENROUTER_API_KEY`, or `GOOGLE_AI_API_KEY` only to backend env when deliberately testing that provider. Never expose those keys through Angular/browser config or `.env.example`.
- [x] Use `AI_PROVIDER=groq` for local provider testing until switching back to mock.
- [x] For the hosted portfolio demo, set production provider keys only on Northflank/backend deployment env vars.
- [x] Set `AI_PROVIDER` for the hosted/backend environment.
- [x] Use `AI_PROVIDER=groq` with `AI_FALLBACK_PROVIDERS=openrouter,google,mock` for the employer-facing demo, or temporarily switch back to `AI_PROVIDER=mock` when avoiding external calls.
- [x] Document provider limits, fallback rules, and data-source disclaimers before using external APIs.
- For Groq: llama-3.1-8b-instant - 30RPM, 14.4k RPD, 6k TPM, 500k TPD;
- For OpenRouter: 20 RPM;
- for Google AI: 250 RPD, 10RPM, 250k TPM;
- First Groq, after OpenRouter, then Google AI;

- For URL analysis, submit HTTPS company URLs. Plain HTTP URLs are intentionally rejected with a safe-link warning.

## Search Discovery Providers

- Add `SEARCH_API_KEY` to backend env when enabling discovery.
- Keep `SEARCH_PROVIDER=disabled` when discovery is not being tested.
- [x] Set `SEARCH_PROVIDER=searchapi` as the primary discovery provider when testing company search.
- Optionally set `SEARCH_API_ENGINE=google`.
- Optionally add `TAVILY_API_KEY` and `SEARCH_FALLBACK_PROVIDER=tavily` for fallback when SearchApi is unavailable or quota-limited.
- Free-ish alternatives to evaluate later, but not implemented in this slice: Crawleo, SearchClaw, SerpApi free tier, Exa free monthly requests/credits, and self-hosted SearXNG.
- [x] Document provider limits and data-source disclaimers before importing external search results into production listings.
- SearchAPI: 100 requests overall;
- Tavily: 1000 requests/month;
- Crawleo: 500 requests/month, 5 concurrent requests;
- Openclaw: 5000 requests/month;
- For search operators - fallback at your judgement;

## Deployment

- [x] Choose the production split: Vercel for Angular frontend, Northflank for the backend/API host, Supabase for PostgreSQL.
- [x] Provision production PostgreSQL through Supabase.
- [x] Add `vercel.json` with a `/api/*` rewrite to the Northflank backend.
- [x] Keep Dockerfile-based API deployment ready for Northflank with `/api/health` health checks.
- [x] Current Vercel production deployment URL: `https://vensight-phi.vercel.app/`.
- [x] Add deployment environment variables: `DATABASE_URL`, `DIRECT_URL`, `SESSION_SECRET`, `AI_PROVIDER`, and provider-specific values when enabled.
- Set `TRUST_PROXY=true` on Northflank or another trusted reverse-proxy host so rate limiting uses the platform-provided client IP. Keep it `false` for direct/local runs.
- Set `API_REQUEST_LOGS=true` on Northflank when you want structured API request/error logs with request IDs for manual monitoring.
- Add backend-only discovery env vars when enabled: `SEARCH_PROVIDER`, `SEARCH_API_KEY`, optional `SEARCH_API_ENGINE`, optional `SEARCH_FALLBACK_PROVIDER`, and optional `TAVILY_API_KEY`.
- [x] Re-run `npm run prisma:migrate:deploy` after deploying the daily usage limit change so Supabase has the `DailyUsage` table.
- Add `PUBLIC_SITE_URL=https://vensight-phi.vercel.app` to Vercel and Northflank so sitemap, canonical, and Open Graph URLs use the current production domain.
- [x] Add backend `ALLOWED_ORIGINS` with exact Vercel preview/production domains before cross-origin API testing. Include `https://vensight-phi.vercel.app` while operating on the Vercel domain.
- [x] Add `API_ONLY=true` to Northflank when Vercel is serving the Angular frontend.
- [x] Replace the initial Northflank host placeholder in `vercel.json`.
- Dashboard login on Vercel requires the Northflank API rewrite, Supabase migrations, `SESSION_SECRET`, and a seeded/admin account; the public frontend can deploy before this is complete, but protected dashboard calls will fail.
- Run Prisma migrations during deployment with `npm run prisma:migrate:deploy`.
- Run seed only for controlled initial data, not as a recurring destructive operation.
- [x] Configure allowed Vercel deployment domains and redirects.
- Add physical database backup download/storage and one restore test.

## Quality Gates

- [x] Add CI commands for `npm run typecheck`, `npm run test`, `npm run prisma:validate`, and `npm run build`.
- [x] Standardize Jasmine + Karma as the Angular browser test setup while keeping Node/API specs on Vitest.
- [x] Run manual quality tasks after GitHub commits: `npm run prisma:validate`, `npm run typecheck`, `npm run test`, and `npm run build`.
- [x] Optimize Lighthouse scores for public SEO routes. Current measured score: desktop 100, mobile 92.
- Add production smoke checks for `/`, `/companies`, `/dashboard/login`, `/api/health`, protected dashboard write endpoints, provider-check, sitemap, and robots.
- Include `https://vensight-phi.vercel.app/` in the first Vercel smoke pass while the custom domain is pending.
- After SEO metadata changes, force a Vercel redeploy and re-check homepage canonical/Open Graph tags because the homepage is the highest-value crawler entry point.
- [x] Sanitize production API error responses so internal database/provider details stay server-side.
- [x] Add request IDs and safe structured API request logs.
- [x] Harden AI URL extraction against localhost, private, reserved, mapped-private, and unsafe redirected hosts before fetching.
- Structured logs are ready for Northflank log review. Later: add hosted error monitoring if traffic grows beyond manual log review.

## Content And SEO

- [x] Add polished fictional seed/mock companies for every launch category.
- [x] Keep public copy clear that the current directory is seeded demo data.
- Replace fictional seed content with reviewed real listings only when launch sources are ready.
- [x] Add legal pages and data-source disclaimers before importing third-party data.
- [x] Add footer access to legal/data-source disclaimer pages.
- [x] Add production metadata, sitemap, robots policy, and default Open Graph image paths.
- Configure DNS and hosting through Vercel for the final production domain, then replace placeholder/default imagery with launch-ready Open Graph assets.
- Review public copy and category taxonomy before launch.
