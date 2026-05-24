# AGENTS.md

## Project goal
Build an Angular SSR business directory with a Node.js backend and AI-assisted company analysis.

## Rules
- Use TypeScript everywhere.
- Keep code clean, modular, and production-like.
- Do not add features outside docs/plan.md unless asked.
- Prefer small vertical slices over big rewrites.
- Add loading, error, and empty states for UI.
- Do not call paid AI APIs by default. Use mock AI unless AI_PROVIDER=real.
- for styling use golden pages concept of website.
- Ask everything is anything is unclear.

## Commands
- npm install
- npm run dev
- npm run build
- npm run lint
- npm run test

## Architecture
- Angular SSR for public SEO pages.
- Dashboard can be CSR.
- Backend is Node.js API.
- Database via Prisma.
- AI output must be cached.
- Vercel for Angular frontend.
- Render/Railway/Fly.io for backend.