# ADR-0003: Supabase as Plain Managed PostgreSQL

## Status
Accepted

## Context
We need a robust, scalable relational database supporting ACID transactions, partial indexes, and row-level locking. We evaluated whether to use Supabase's full platform features (Supabase Auth, PostgREST Data API, Realtime, Edge Functions) or use it strictly as managed PostgreSQL.

## Decision
Use Supabase **strictly as managed PostgreSQL**:
1. The Node.js backend is the sole client connecting to PostgreSQL.
2. The frontend talks exclusively to the NestJS API; `supabase-js` is not installed or used.
3. Supabase Auth is not used because:
   - The PRD password policy (length > 8 chars, uppercase + lowercase + special) does not map to Supabase Auth's defaults.
   - Admin-only staff creation and role escalation prevention live more cleanly in our own `identity` module.
4. Schemas: Every module owns a dedicated Postgres schema (`identity`, `billing`, etc.); `public` is never used.
5. RLS Lockdown: Every table has `ENABLE ROW LEVEL SECURITY` with zero policies, and all privileges revoked from `anon` and `authenticated`.
6. Migrations: Drizzle ORM + `drizzle-kit` is the sole migration tool.
7. Background jobs: Handled by `pg-boss` (schema `pgboss`) running on Postgres without Redis.

## Consequences
- **Positive:** Complete control over auth and domain rules, zero vendor lock-in to Supabase-specific client SDKs, clean single source of truth for users and business logic.
- **Negative:** We implement JWT authentication, token rotation, and password reset flows within the `identity` module rather than using pre-built managed services.
