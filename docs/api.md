# API foundation

The backend uses the Angular SSR Express server as a REST API host. Directory, auth, and AI analysis cache data run from Prisma/PostgreSQL when `DATABASE_URL` is configured; in-memory stores are development-only fallbacks for local UI work. AI analysis supports mock, local Ollama, Groq, OpenRouter, and Google providers through the backend provider layer.

## Endpoints

- `GET /api/health`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `POST /api/auth/register`
- `GET /api/auth/developers`
- `POST /api/auth/developers`
- `GET /api/analytics/directory`
- `GET /api/categories`
- `GET /api/categories/:slug/companies`
- `GET /api/companies`
- `GET /api/companies?q=search&category=category-slug`
- `GET /api/companies/:slug`
- `POST /api/companies`
- `PATCH /api/companies/:slug`
- `POST /api/ai/analyze`
- `POST /api/ai/provider-check`
- `GET /api/ai/analyses?limit=10`
- `POST /api/ai/compare`
- `POST /api/discovery/search`
- `GET /api/discovery/candidates`
- `POST /api/discovery/candidates`
- `PATCH /api/discovery/candidates/:id`
- `GET /api/config/runtime`

`GET /api/health` is intentionally minimal and public:

```json
{
  "status": "ok",
  "service": "vensight-api",
  "checkedAt": "2026-05-25T00:00:00.000Z"
}
```

Detailed runtime/provider status is available through the protected admin-only `GET /api/config/runtime` endpoint.

## Auth

`POST /api/auth/login` accepts:

```json
{
  "email": "imarkovychi@gmail.com",
  "password": "<SEEDED_ADMIN_PASSWORD>"
}
```

It returns a dashboard session and sets an HttpOnly session cookie for hosted browser sessions:

```json
{
  "data": {
    "user": {
      "email": "imarkovychi@gmail.com",
      "role": "admin"
    },
    "issuedAt": "2026-05-12T00:00:00.000Z",
    "expiresAt": "2026-05-19T00:00:00.000Z"
  }
}
```

`POST /api/auth/register` creates a user role account. Dashboard passwords must be at least 12 characters and include uppercase, lowercase, and a number. `GET /api/auth/developers` and `POST /api/auth/developers` require a signed dashboard session. With `DATABASE_URL`, users and developers are persisted with hashed passwords, and session tokens are stored as hashed, expiring database sessions. Without `DATABASE_URL`, sessions remain signed development tokens. The seeded admin password is configurable with `SEEDED_ADMIN_PASSWORD`; do not expose it in browser copy or production docs.

`POST /api/auth/logout` accepts the current cookie or bearer token and returns `{ "data": { "success": true } }`. With `DATABASE_URL`, the matching database session is marked revoked so the session can no longer authorize protected API calls. Without `DATABASE_URL`, logout is idempotent and browser-side storage is cleared by the Angular app.

`POST /api/auth/refresh` accepts the current cookie or bearer token and returns a replacement session with a new `issuedAt` and `expiresAt`. With `DATABASE_URL`, the old session is revoked as part of refresh. Expired, revoked, or malformed sessions return `403`.

## Dashboard analytics

`GET /api/analytics/directory` returns metrics computed from the active directory repository:

```json
{
  "data": {
    "listingCount": 6,
    "aiSummaryCount": 6,
    "seoDescriptionCount": 6,
    "aiCoverage": 100,
    "seoReadiness": 100,
    "categoryCount": 4,
    "averageTags": "3.0",
    "categoryMetrics": [
      {
        "name": "AI Tools",
        "count": 2,
        "percentage": 33
      }
    ]
  }
}
```

## Company writes

`POST /api/companies` and `PATCH /api/companies/:slug` accept the dashboard listing form shape:

```json
{
  "name": "Example",
  "website": "https://example.com",
  "categorySlug": "ai-tools",
  "tags": ["AI analysis", "Automation"],
  "description": "Example helps teams understand market signals.",
  "aiSummary": "Example appears positioned as an AI tools company.",
  "seoDescription": "Explore Example in Vensight."
}
```

Without `DATABASE_URL`, writes are stored in Express memory. With `DATABASE_URL`, writes are persisted through Prisma/PostgreSQL.

Both write endpoints require `Authorization: Bearer <token>` from an admin or developer session.

## AI analysis

`POST /api/ai/analyze` accepts an HTTPS company URL:

```json
{
  "url": "https://example.com"
}
```

The endpoint normalizes the URL, extracts static HTTPS page evidence, runs the configured AI provider, caches the result by normalized URL, and returns a generated listing payload with provider metadata. The cache is in-memory without `DATABASE_URL` and Prisma-backed with `DATABASE_URL`.

Plain `http://` URLs are rejected with a safe-link warning and do not fetch the page or call an AI provider. The extractor also rejects localhost/private/internal hosts, non-HTML responses, oversized pages, and unsafe protocols.

Supported providers:

- `AI_PROVIDER=mock`: deterministic local development output, no external calls.
- `AI_PROVIDER=ollama`: local Ollama `/api/generate` call using `OLLAMA_BASE_URL` and `OLLAMA_MODEL`.
- `AI_PROVIDER=groq`: Groq OpenAI-compatible chat completions using `GROQ_API_KEY` and `GROQ_MODEL`.
- `AI_PROVIDER=openrouter`: OpenRouter chat completions using `OPENROUTER_API_KEY` and `OPENROUTER_MODEL`.
- `AI_PROVIDER=google`: Gemini `generateContent` using `GOOGLE_AI_API_KEY` and `GOOGLE_MODEL`.

Provider API keys are backend-only environment variables. The Angular/browser app never receives `GROQ_API_KEY`, `OPENROUTER_API_KEY`, or `GOOGLE_AI_API_KEY`.

This endpoint requires a signed dashboard session. Registered user accounts can run one analysis per UTC day; admin/developer roles can run analysis for review and publishing workflows. Public competitor comparison stays readable without dashboard auth.

The AI prompt receives extracted evidence before fallback seed data:

- page title and meta description
- headings and static visible text snippets
- schema.org JSON-LD organization/product/service data
- page-embedded aggregate rating or review signals when present
- extraction status, warning, and character-count metadata

No external search, review, Crunchbase, Clearbit, or Apify calls are made in this slice.

```json
{
  "data": {
    "url": "https://example.com",
    "hostname": "example.com",
    "provider": "mock",
    "model": "mock-qwen2.5-7b-profile-generator",
    "confidence": 0.85,
    "fromCache": false,
    "source": {
      "contentAware": true,
      "status": "extracted",
      "safetyStatus": "https",
      "url": "https://example.com",
      "title": "Example",
      "extractedCharacters": 3200,
      "schemaTypes": ["Organization"],
      "warnings": []
    },
    "formData": {
      "name": "Example",
      "website": "https://example.com",
      "categorySlug": "ai-tools",
      "tags": ["AI analysis", "Automation", "Business intelligence"],
      "description": "...",
      "aiSummary": "...",
      "seoDescription": "..."
    }
  }
}
```

`GET /api/ai/analyses?limit=10` returns recent cached analysis results for the signed-in admin/developer. The endpoint reads from memory without `DATABASE_URL` and from Prisma/PostgreSQL with `DATABASE_URL`.

`POST /api/ai/provider-check` is a protected admin/developer diagnostic endpoint for validating the currently selected `AI_PROVIDER` without creating a directory listing or returning backend secrets. It accepts the same HTTPS-only URL shape as analysis and returns safe metadata plus a generated profile preview:

```json
{
  "data": {
    "success": true,
    "provider": "groq",
    "model": "llama-3.1-8b-instant",
    "normalizedUrl": "https://example.com",
    "hostname": "example.com",
    "durationMs": 1240,
    "fromCache": false,
    "confidence": 0.83,
    "createdAt": "2026-05-24T00:00:00.000Z",
    "source": {
      "contentAware": true,
      "status": "extracted",
      "safetyStatus": "https",
      "url": "https://example.com",
      "schemaTypes": ["Organization"],
      "extractedCharacters": 3200,
      "warnings": []
    },
    "profilePreview": {
      "name": "Example",
      "categorySlug": "ai-tools",
      "tags": ["AI analysis", "Automation"],
      "description": "Example helps teams understand market signals.",
      "aiSummary": "Example is positioned around AI analysis.",
      "seoDescription": "Explore Example on Vensight."
    }
  }
}
```

Provider failures return the same safe metadata with `success: false`, an `error` message, and no profile preview. Invalid, unsafe, or plain HTTP URLs return `400`; configured-provider runtime failures return `502`.

The dashboard AI Analysis page exposes this check as a diagnostics action beside the normal URL analysis flow. It can prove the active provider is reachable without clicking "Create listing".

## Runtime config

`GET /api/config/runtime` requires an admin session and returns safe backend configuration status. It includes provider names, model names, booleans, and missing env variable names, but never secret values.

## Search discovery

`POST /api/discovery/search` requires a signed dashboard session and accepts:

```json
{
  "query": "biotech companies Denmark",
  "category": "biotech pharma",
  "location": "Europe",
  "limit": 6
}
```

It returns safe candidate URL metadata from the configured search provider. It does not analyze URLs and never creates company listings.

`GET /api/discovery/candidates` lists the optional review queue. `POST /api/discovery/candidates` saves a selected search result into the queue. `PATCH /api/discovery/candidates/:id` updates status to `new`, `reviewing`, `accepted`, `rejected`, or `analyzed`, with an optional `analysisUrl`. The current dashboard flow sends search results directly to AI analysis, so the queue endpoints are available for a future review workflow but are not required for basic discovery.

Search discovery is off when `SEARCH_PROVIDER=disabled`. SearchApi is the primary provider through `SEARCH_PROVIDER=searchapi`, `SEARCH_API_KEY`, and optional `SEARCH_API_ENGINE=google`. Tavily can be used as an optional fallback with `SEARCH_FALLBACK_PROVIDER=tavily` and `TAVILY_API_KEY`. Provider keys stay backend-only. Registered user accounts can run one discovery search per UTC day; admin/developer roles are exempt for review work.

## SEO assets

`GET /robots.txt` returns a crawl policy that allows public pages, blocks `/dashboard` and `/api`, and points crawlers at `/sitemap.xml`.

`GET /sitemap.xml` returns XML for the homepage, company listing, compare page, category pages, and company detail pages. It reads from the active directory repository, so sitemap entries come from Prisma/PostgreSQL when `DATABASE_URL` is configured and from the in-memory directory otherwise. Set `PUBLIC_SITE_URL=https://vensight-phi.vercel.app` while operating on the Vercel production domain, then replace it with the final custom domain after DNS is live.

## Competitor comparison

`POST /api/ai/compare` accepts two company slugs:

```json
{
  "leftSlug": "novalens",
  "rightSlug": "signalharbor"
}
```

The endpoint compares existing directory companies and returns deterministic positioning insight:

```json
{
  "data": {
    "sharedCategory": true,
    "overlappingTags": ["AI"],
    "provider": "mock",
    "model": "mock-qwen2.5-7b-competitor-comparison",
    "confidence": 0.87,
    "summary": "NovaLens and SignalHarbor both sit in AI Tools.",
    "recommendation": "Compare proof, use cases, and audience fit before choosing between NovaLens and SignalHarbor."
  }
}
```

## Notes

- Directory, auth, auth sessions, and AI analysis cache endpoints use Prisma/PostgreSQL when `DATABASE_URL` is configured; otherwise they use shared in-memory development stores. Prisma CLI workflows use `DIRECT_URL` when configured.
- In production, unexpected API failures return route-level fallback messages while internal error details are logged server-side. Known client validation messages remain readable.
- AI analysis cache entries store new content-aware source metadata inside `generatedData`; older cached entries without source metadata remain readable and are refreshed on the next analysis request.
- If Prisma is configured but a database operation fails, the API returns an error instead of silently writing to memory.
- Browser-side auth uses these endpoints with local development fallback only on non-hosted local origins. Hosted browser sessions use an HttpOnly session cookie.
- Browser-side dashboard analytics uses the API with local computed fallback if the API is unavailable.
- Browser-side directory reads use these endpoints with a frontend fallback to seed data.
- Browser-side AI analysis uses this endpoint with a frontend development fallback only when the API is unavailable on non-hosted local origins.
- Public competitor comparison uses the compare endpoint with local fallback.
- Dashboard create/edit uses the REST API in the browser and falls back to the frontend in-memory service only for non-hosted local development if the API is unavailable.
- Later backend work can split the API into NestJS-style modules if the service grows, but the current hosted architecture is Vercel frontend plus Northflank API plus Supabase PostgreSQL.
