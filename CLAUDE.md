# CLAUDE.md

## What This Is

Audit workflow marketplace. Users create, share, and export visual workflow diagrams ("Swarms") built with React Flow. Exports are compatible with AuditSwarm-GCP. An AI copilot (Gemini-powered, multi-agent) helps users execute audit steps.

A **Swarm** = a workflow template of connected step nodes defining an audit process.

## Stack

Next.js 15 (App Router) · React 18 · TypeScript · Tailwind CSS · Shadcn/ui · React Flow 11 · Prisma (PostgreSQL) · NextAuth.js (LinkedIn OAuth) · React Query · Zustand · Google Gemini API · Upstash Redis (rate limiting) · GCP Cloud Run

## Commands

```bash
npm run dev              # Dev server (port 3000)
npm run build            # Production build
npm run lint             # ESLint
npm run type-check       # TypeScript check
npx prisma generate      # Regenerate client after schema changes
npx prisma migrate dev   # Run migrations locally
npx prisma studio        # Database GUI
```

Cloud SQL proxy for local DB: `./cloud-sql-proxy --port 5432 toolbox-478717:us-central1:toolbox-db`

## Key Conventions

- **Workflow data is stored as JSON strings** in the database (`workflowNodes`, `workflowEdges`, `workflowMetadata`). Always `JSON.parse()` on read and `JSON.stringify()` on write.
- **DB operations** live in `src/lib/db/` — one file per domain (swarms, favorites, ratings, etc.).
- **API routes** use `requireAuth()` and `handleApiError()` from `src/lib/api/helpers.ts`.
- **React Query hooks** in `src/hooks/useSwarms.ts` — all server state goes through these, not raw fetch.
- **Copilot agents** are in `src/lib/copilot/adk/agents/` — multi-agent system with orchestrator, wrangler, judge, analyzer.
- **UI components** use Shadcn/ui from `src/components/ui/`. Don't install new UI libraries without asking.
- **Soft deletes** — Users have `isDeleted`/`deletedAt` fields. Filter them in queries.
- **Rate limiting** is in `middleware.ts` via Upstash Redis, configured per-path.

## Project Structure

```
src/app/                  # Pages & API routes
src/components/ui/        # Shadcn/ui primitives
src/components/workflows/ # React Flow canvas, nodes, edges
src/components/copilot/   # AI chat interface
src/hooks/                # React Query hooks
src/lib/db/               # Prisma database operations
src/lib/copilot/          # Multi-agent AI system (Gemini)
src/lib/auth/             # NextAuth config
src/types/                # TypeScript types
prisma/schema.prisma      # Database schema (source of truth)
bluth/                    # SAP CAP mock OData server for audit testing
```

## Gotchas

- `strict` is **off** in tsconfig — don't assume strict null checks.
- ESLint is disabled during `npm run build` (Next.js 15 compatibility). Run `npm run lint` separately.
- The Prisma schema has denormalized counters (`favorites_count`, `rating_avg`, `downloads_count`, `views_count`) on Swarm — update them alongside the related records.
- Port 8080 in production (Cloud Run), 3000 in dev.
- Path alias: `@/*` maps to `./src/*`.
