# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev           # Start all apps + packages in watch mode
npm run dev:web       # Start only Next.js admin panel (port 3000)
npm run dev:bot       # Start only Telegram bot (tsx watch)

# Build
npm run build         # Build all packages and apps (respects dependency graph)
npm run build:web     # Build only the web app
npm run build:bot     # Build only the bot

# Lint (type-check only, no eslint configured)
npm run lint          # tsc --noEmit across all packages

# Database
npm run db:migrate    # Push migrations to Supabase (supabase db push)
npm run db:seed       # Run seed data (supabase db seed)
npm run db:types      # Regenerate TypeScript types from Supabase schema
```

## Architecture

Turborepo monorepo for a home-visit medical services platform (Черкесск). All code is TypeScript.

### Package Dependency Graph

```
apps/web (Next.js 15, App Router)
├── @medplus/db
├── @medplus/scheduling
└── @medplus/documents

apps/bot (grammY Telegram bot)
└── @medplus/db

packages/scheduling
└── @medplus/db

packages/documents
└── @medplus/db

packages/db (leaf — no internal deps)
└── @supabase/supabase-js
```

### `packages/db` — Database Layer

Supabase client + TypeScript types + reusable query modules. Types in `src/types.ts` mirror the Supabase schema (13 tables, custom enums). Query modules: orders, patients, nurses, services, inventory, payments.

### `packages/scheduling` — Algorithms

- **Nurse assignment** (`src/nurse-assignment/`): Filter available nurses → score candidates (distance 30%, workload 25%, gap minimization 20%, experience 15%, patient familiarity 10%) → rank and return best match
- **Route optimizer** (`src/route-optimizer/`): Greedy algorithm with time windows for driver task sequencing
- **Geo utils** (`src/utils/geo.ts`): Haversine distance, driving time estimation, proximity clustering

### `packages/documents` — PDF Generation

Uses `pdf-lib` to generate Russian-language PDFs: contracts, informed consent, service acts, receipts. Templates in `src/templates/`, rendering engine in `src/generator.ts`.

### `apps/web` — Next.js Admin Panel

**Supabase client pattern** — three separate clients:
- `src/lib/supabase/client.ts` → `getSupabaseBrowserClient()` — browser singleton, anon key
- `src/lib/supabase/server.ts` → `createSupabaseServerClient()` — SSR with cookie-based auth
- `src/lib/supabase/server.ts` → `createSupabaseAdmin()` — service role key, server-only

**Auth flow**: Middleware (`src/middleware.ts`) calls `updateSession()` on every request. Unauthenticated users redirect to `/login`. Public paths: `/login`, `/api/telegram`.

**Route groups**:
- `(auth)/login` — login page
- `(dashboard)/` — sidebar layout with all admin pages (orders, schedule, map, nurses, patients, inventory, finance, settings)
- `api/` — REST endpoints: orders CRUD, scheduling/assign, routing, documents/generate, payments, inventory, telegram/webhook

Server Components fetch data directly via `createSupabaseServerClient()`. Client Components use `getSupabaseBrowserClient()`. API routes that need elevated access use `createSupabaseAdmin()`.

### `apps/bot` — Telegram Bot

grammY framework with `@grammyjs/conversations` plugin for multi-step booking flow. Uses Supabase admin client directly (service role key). Session stores `patient_id`. Main conversation: category → service → address → date → time → supplies → confirm → create order.

### Database Schema

SQL migration in `supabase/migrations/00001_initial_schema.sql`. Core tables: profiles (auth), patients, nurses, drivers, services, orders (central), nurse_schedules, driver_routes, route_points, inventory, purchase_orders, payments, notifications. RLS enabled on all tables. `orders.total_price` is a GENERATED column (`service_price + surcharge + supplies_cost`). Trigger auto-updates `updated_at` on orders.

## Key Conventions

- All internal packages use `"main": "./src/index.ts"` (no pre-build needed for dev; Next.js transpiles via `transpilePackages`)
- Path alias in web app: `@/*` → `./src/*`
- UI components in `apps/web/src/components/ui/` follow shadcn/ui patterns (not installed via CLI, manually created)
- All user-facing text is in Russian
- Environment variables: `NEXT_PUBLIC_*` for browser-safe, `SUPABASE_SERVICE_ROLE_KEY` and `TELEGRAM_BOT_TOKEN` are server-only
