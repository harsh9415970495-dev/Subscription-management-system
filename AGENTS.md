# Brightloop Subscription Management System — Agent Instructions

> **Standing instructions for autonomous coding agents.** Read automatically before executing any task.

---

## 1. Stack & Architecture

- **Backend:** Node.js 22 LTS, NestJS, TypeScript (strict).
- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS (custom utilitarian tokens), TanStack Query, TanStack Table, React Hook Form + Zod.
- **Database:** Supabase managed PostgreSQL **only**. The backend is the sole database client.
  - No Supabase Auth, no PostgREST data API, no Realtime, no Edge Functions, no `supabase-js` in frontend.
  - Schema per module (`identity.*`, `catalog.*`, `billing.*`, etc.), **never `public`**.
  - `ENABLE ROW LEVEL SECURITY` on every table with zero policies; `REVOKE ALL` from `anon` and `authenticated`.
  - Database access: API uses pooled port 6543 (`prepare: false`). Migrations and jobs use direct port 5432.
- **ORM / Migrations:** Drizzle ORM + `drizzle-kit` (`postgres-js` driver). Drizzle is the **only** migration system.
- **Jobs / Scheduling:** `pg-boss` (schema `pgboss`) running on Postgres direct connection. No Redis.
- **Package Manager:** `pnpm` exclusively.

---

## 2. Boundary Rules (Enforced by CI)

1. **Facade Only:** Modules communicate strictly via each module's `index.ts` public facade. Never import another module's internal files (`../other/infrastructure/*` or domain internals).
2. **Schema Ownership:** Each module owns its dedicated Postgres schema. Foreign keys across schemas are allowed for integrity; cross-module joins in application code are forbidden (call the facade).
3. **Pure Domain:** `domain/` contains zero imports from NestJS, Drizzle, or other modules. It is pure TypeScript and fully unit-testable.
4. **Thin Controllers:** Controllers parse inputs, invoke a single application service, and present the response. No business logic.
5. **Shared Kernel:** `shared/` contains technical abstractions only (`Money`, FSM, pagination, events, errors). No domain rules.
6. **Reporting Exception:** `reporting` is read-only. It may query across schemas for reporting views, but never writes.

---

## 3. Money & Invariant Rules

- **Integer Minor Units:** All money amounts are stored and calculated as integers in minor units (e.g. paise).
- **No Floats:** Never use floating point numbers for currency calculations.
- **Currency:** Single base currency (`INR`).
- **Rounding:** Half-up rounding, applied per line item.

---

## 4. Utilitarian Design System Rules (§3.2)

- **Zero Radius:** `border-radius: 0` everywhere. 1px solid borders (`--line: #2A2D26`).
- **No Shadows or Blur:** No box-shadows, gradients, glassmorphism, illustrations, or emoji.
- **Monospaced Data:** Monospaced font (`--font-mono`: IBM Plex Mono) for data, IDs, status, and labels. Numbers use `tabular-nums` and are right-aligned. Headings use condensed sans uppercase tracked.
- **Bracketed Status Tags:** Statuses must use bracketed uppercase tags (e.g. `[DRAFT]`, `[CONFIRMED]`, `[ACTIVE]`, `[PAID]`, `[OVERDUE]`) paired with an 8px square marker.
- **Zero Motion:** No transitions, animations, or skeleton shimmer. Loading states are text: `LOADING…`.

---

## 5. Standard Commands

- `pnpm dev` — Start backend API and frontend dev server.
- `pnpm test` — Run all unit and integration tests.
- `pnpm check:boundaries` — Run dependency-cruiser boundary checks.
- `pnpm db:start` — Start local Supabase stack (`supabase start`).
- `pnpm db:migrate` — Apply Drizzle migrations via direct connection.
- `pnpm lint && pnpm typecheck` — Code quality verification.

---

## 6. Ambiguity & Safety Guard-rails

- If any billing, discount, tax, or permission requirement is ambiguous: **stop and ask the user**. Do not invent requirements.
- Destructive commands (`rm -rf`, `drop`, `git push --force`, `git reset --hard`, `supabase db reset`) require human approval.
- Never edit an applied migration — add a new migration.
