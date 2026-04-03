# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   └── api-server/         # Express API server
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health` (full path: `/api/health`)
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas (no models definitions exist right now)
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`). Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec (e.g. `useHealthCheck`, `healthCheck`).

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.

## NicheFlow Application

Full-stack AI business OS for niche small businesses in India (dog trainers, tailors, photographers, urban farmers, etc.).

### Auth
- JWT (`bcryptjs`), token stored in `localStorage` as `nf_token`, 30-day expiry
- Middleware: `artifacts/api-server/src/middleware/auth.ts`

### Frontend (artifacts/nicheflow — `@workspace/nicheflow`)
- **Router**: `wouter` with `base={import.meta.env.BASE_URL}`
- **State**: React context (AuthContext, WorkspaceContext)
- **UI**: Tailwind CSS + shadcn-style custom components, Recharts, framer-motion, dnd-kit
- **Pages**: Dashboard, Bookings, Clients, ClientProfile, Invoices, InvoiceDetail, Inventory, Tasks, Settings, PublicPageEditor, PublicPage (public), PublicInvoice (public)

### Modules
| Module | Route | Key File |
|---|---|---|
| Dashboard | `/dashboard` | `Dashboard.tsx` |
| Bookings | `/bookings` | `Bookings.tsx` |
| Clients | `/clients` | `Clients.tsx` |
| Invoices | `/invoices` | `Invoices.tsx` |
| Inventory | `/inventory` | `Inventory.tsx` |
| Tasks (Kanban/List/Calendar + dnd-kit) | `/tasks` | `Tasks.tsx` |
| Public Page Editor | `/public-page` | `PublicPageEditor.tsx` |
| Public Business Page | `/p/:slug` | `PublicPage.tsx` |
| Settings (9-section, i18n) | `/settings` | `Settings.tsx` |

### API Routes (`artifacts/api-server/src/routes/`)
- `auth.ts` — register, login, me
- `onboarding.ts` — AI onboarding, workspace config
- `business.ts` — business profile + dashboard analytics
- `bookings.ts` — CRUD + calendar
- `clients.ts` — CRUD + search
- `invoices.ts` — CRUD + PDF + public view
- `inventory.ts` — CRUD + movements
- `tasks.ts` — CRUD + subtasks + comments + recurring + status
- `publicPage.ts` — editor API + public slug page + booking widget + reviews
- `settings.ts` — profile, workspace, language, notifications, AI prefs, team, export CSV, delete account
- `ai.ts` — AI insight endpoint

### DB Schema (`lib/db/src/schema/`)
Tables: `users`, `businesses`, `workspaceConfigs`, `clients`, `bookings`, `invoices`, `inventory`, `inventoryMovements`, `tasks`, `clientNotes`, `publicPageConfigs`, `publicPageReviews`

### i18n
- `i18next` + `react-i18next` installed in `@workspace/nicheflow`
- Setup: `src/i18n.ts` (imported first in `main.tsx`)
- Locale files: `src/locales/en.json` (English) + `src/locales/hi.json` (Hindi)
- **Complete key coverage**: nav, common, status, auth, onboarding, dashboard, bookings, clients, invoices, inventory, tasks, publicPage, empty states, toast messages, all settings sections
- Language stored in `localStorage` as `nf_lang` and in DB (`workspaceConfigs.language`)
- `useTranslation()` hook from `react-i18next` for i18n in components
- Other languages (Tamil, Telugu, Kannada, Marathi, Bengali, Gujarati) marked "coming soon"

### Performance
- **Lazy loading**: All page components in `App.tsx` use `React.lazy` + `Suspense` with spinner fallback
- **Skeleton loaders**: `src/components/ui/Skeleton.tsx` — `Skeleton`, `SkeletonCard`, `SkeletonTable`, `SkeletonPage`, `SkeletonDashboard`
- **Debounce hook**: `src/hooks/useDebounce.ts` — 300ms default, use for search inputs

### Accessibility
- WCAG AA focus styles via `focus-visible` CSS on all interactive elements (2px primary outline)
- No horizontal overflow (html/body/root `overflow-x: hidden; max-width: 100vw`)
- Mobile-first login/auth pages verified at 375px (iPhone SE)

### Simple Mode Wizards
Step-by-step bottom-sheet / centered modal wizards (slide-up animation, progress dots):
- `src/components/wizard/BookingWizard.tsx` — 4 steps: client → service → date/time → confirm
- `src/components/wizard/ClientWizard.tsx` — 4 steps: name → phone → notes → done (with VoiceMic)
- `src/components/wizard/InvoiceWizard.tsx` — 5 steps: client → items → amounts+tax → due date → confirm
- All wizards call real API endpoints and show spring-animated progress bars

### Global Features (8 systems)
- **Floating AI Assistant** — `/api/ai/chat` with business context, voice input, suggested prompts
- **Command Palette** (⌘K) — nav + client search + AI routing, recent actions persisted
- **Notifications Bell** — real DB data, read/unread badge, relative timestamps
- **Simple Mode** — `simple-mode` CSS class on `<html>`, persists to localStorage
- **Voice Input** — `VoiceMic` component using Web Speech API
- **Toast System** — `ToastContext`, 4 types, auto-dismiss, undo support
- **Date Filter** — Today/Week/Month pills in header, `DateFilterContext`
- **Mobile Bottom Nav** — fixed bar + FAB quick-add + More drawer (< 768px)

### Key Conventions
- Currency: INR, `formatINR()` helper
- AI model: `gpt-4o-mini`, env: `AI_INTEGRATIONS_OPENAI_BASE_URL`
- Workspace config: `GET /api/onboarding/config` — returns `terminology`, `niche`, `modules`, `services`, etc.
- Settings API: `GET /api/settings` — returns `{ user, business, workspace, settings }` (settings is merged defaults + DB)
- Settings stored: basic info in `businesses`/`users` tables; misc (notifications, AI prefs, team, integrations, operating hours) in `workspaceConfigs.settings` jsonb; language in `workspaceConfigs.language`
- DB push: `pnpm --filter @workspace/db run push`
