---
description: Supabase PostgreSQL connection rules, pooler vs direct ports, RLS lockdown, and schema policies
alwaysApply: true
---

# Supabase PostgreSQL Integration Rules

## 1. Scope of Supabase Usage
- Supabase is used **only as managed PostgreSQL**.
- The Node.js backend is the sole client connecting to the database.
- The React frontend **never** connects to Supabase directly and must not import `supabase-js`.
- Supabase Auth, PostgREST Data API, Realtime, and Edge Functions are **not used**.
- Local environment uses the Supabase CLI (`supabase start`). Never connect to, link, or run migrations against a hosted Supabase project during local development.

## 2. Connections & Ports
1. **Runtime API Connection (`DATABASE_URL`):**
   - Connects through the Supavisor **transaction pooler** on port `6543`.
   - Driver configuration: `prepare: false` (no prepared statements).
   - Rules: No session-level `SET` commands, no temp tables, no session advisory locks.
   - `SELECT ... FOR UPDATE SKIP LOCKED` is permitted within explicit transactions.
2. **Migrations & Worker Connection (`DATABASE_URL_DIRECT`):**
   - Connects through direct connection / session pooler on port `5432`.
   - Used for `drizzle-kit migrate` and the `pg-boss` background job worker.

## 3. Schemas & Row Level Security (RLS)
1. **Never Public:** Tables must be placed in their module's dedicated schema (`identity`, `customers`, `catalog`, `plans`, `taxation`, `discounts`, `subscriptions`, `billing`, `payments`, `reporting`, `notifications`, `audit`), never `public`.
2. **RLS Lockdown:** Every table must have `ENABLE ROW LEVEL SECURITY` with **zero policies**.
3. **Revoke Permissions:** `REVOKE ALL` on all module schemas and tables from `anon` and `authenticated`.
4. **Backend Role:** The backend connects using a service role that bypasses RLS; authorization is enforced in application code via guards and `CustomerScope`.
5. **CI Enforcement:** A dedicated automated test fails the build if any table in our schemas has RLS disabled.

## 4. Migrations
- **Drizzle Kit Only:** All schema migrations are managed via Drizzle Kit (`pnpm db:migrate`) and committed as SQL files under `backend/migrations/`.
- Never edit an applied migration file. Add a new migration to evolve schema.
- Do not use `supabase db push` or manually edit tables via Supabase Studio.
