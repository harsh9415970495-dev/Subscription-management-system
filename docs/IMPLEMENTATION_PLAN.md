# IMPLEMENTATION_PLAN.md — Brightloop Subscription Management System

> **Audience:** autonomous coding agents (Antigravity IDE running Gemini Pro or Claude Sonnet) and the human reviewer supervising them.
> **Stack (confirmed):** Node.js backend · React frontend · Supabase (managed PostgreSQL) database — see §1 and §1.1.
> **How to use:** place this file at `docs/IMPLEMENTATION_PLAN.md`. Work one phase per agent session. Never start a phase until the previous phase's **Exit Gate** is green.
> **Source of truth for requirements:** `docs/requirements/Subscription_Management_System.pdf` (the "scenes"). If this plan and the PDF disagree, the PDF wins — flag it, don't silently choose.

---

## 0. Product Summary

One platform that runs the full life of a subscription business: **products → plans → quotations → subscriptions → invoices → payments → revenue reporting**, with three audiences:

| Role | Who | Scope |
|---|---|---|
| `ADMIN` | Owner of configuration | Everything. Only role that creates staff, products, plans, taxes, discounts, payment terms, quotation templates. |
| `STAFF` | Internal day-to-day team | Customers, quotations, subscriptions, invoices, payments, reports. Read-only on configuration. Cannot create staff. |
| `CUSTOMER` | Portal user | Only their own subscriptions, invoices, payments. Self-service actions allowed by the plan's flags. |

**Non-functional headline:** with thousands of subscriptions, **every page responds in < 2 s** (API p95 target < 300 ms).

---

## 1. Technology Decisions

These are decisions, not suggestions. Agents must not swap them without an ADR in `docs/adr/`.

| Concern | Choice | Reason |
|---|---|---|
| Backend runtime | **Node.js** 22 LTS + TypeScript (strict) | One language across the stack, best agent proficiency (see A-12 if you want plain JS) |
| Backend framework | **NestJS** | Native module system maps 1:1 to modular-monolith boundaries |
| Database | **Supabase** (managed PostgreSQL) | Transactions, partial indexes, `FOR UPDATE SKIP LOCKED`, `pg_trgm`; used as plain Postgres only — see §1.1 |
| ORM / migrations | **Drizzle ORM** + drizzle-kit (`postgres-js` driver) | Schema defined per module, close to SQL, officially works with Supabase; drizzle-kit is the **only** migration system |
| Jobs / scheduling | **pg-boss** (queue + schedules stored in Postgres) | Billing runs, activation/expiry sweeps, email sending — no Redis to operate |
| Validation | class-validator DTOs (API edge) + pure domain invariants | |
| Auth | Backend-owned: JWT access token (15 min) + refresh token (httpOnly, SameSite=Strict cookie), **argon2id** hashing. **Not** Supabase Auth | Exact password policy, 3-role model, admin-only staff creation (see §1.1) |
| Email | Nodemailer; **Mailpit** in local dev, any SMTP provider in staging/prod | Reset links, invoice sending |
| PDF | `pdfkit` (invoice print/PDF) | No headless browser dependency |
| API style | REST `/api/v1`, OpenAPI via `@nestjs/swagger`, RFC 7807 errors | |
| Frontend | **React** 18 + Vite + TypeScript, React Router, TanStack Query, TanStack Table, React Hook Form + zod | |
| Styling | Tailwind CSS with **custom utilitarian tokens** (see §3) | |
| Testing | Vitest/Jest (unit), Testcontainers + Supertest (integration), Playwright (E2E), k6 (performance) | |
| Local infra | **Supabase CLI** local stack (`supabase start`) for Postgres; Docker Compose for Mailpit only | |
| CI | GitHub Actions: lint → typecheck → boundary check → unit → integration → E2E | |
| Package manager | pnpm | |

**Money rule (non-negotiable):** all amounts are **integers in minor units** (e.g. paise) in the database and domain layer. Never use floating point. Single base currency, configurable via env (`BASE_CURRENCY=INR`). Rounding: half-up, per line.

---

## 1.1 Supabase Integration Decisions

Supabase is used as **managed PostgreSQL only**. The Node.js backend is the **only** client of the database. The React app talks exclusively to the backend API and never to Supabase directly.

| Topic | Decision |
|---|---|
| Used | Supabase-hosted Postgres. Optional (stretch): private Storage bucket for archived invoice PDFs, accessed by the backend only. |
| **Not** used | Supabase Auth, the auto-generated Data API (PostgREST), Realtime, Edge Functions, `supabase-js` in the browser. |
| Why not Supabase Auth | The PDF's password policy (more than 8 chars, upper + lower + special, no digit requirement) does not map onto Supabase's built-in password options, and its recovery flow lets the browser set a new password directly, bypassing server-side policy. Admin-only staff creation and the three-role model also live more cleanly in one `identity` module with one source of truth for users. Revisit by ADR if SSO is ever required. |
| Connections | **Runtime (API):** Supavisor *transaction* pooler, port 6543, driver option `prepare: false`. **Migrations, pg-boss, anything needing session features:** direct connection or *session* pooler (port 5432). Env vars: `DATABASE_URL` (pooled) and `DATABASE_URL_DIRECT`. SSL required in hosted environments. |
| Pooler rules | Inside pooled connections: no prepared statements, no `SET` outside a transaction, no temp tables, no session-level advisory locks (use `pg_advisory_xact_lock`). `SELECT … FOR UPDATE SKIP LOCKED` is fine because it runs inside one explicit transaction. |
| Pool size | `DB_POOL_MAX` defaults to 10 per API instance. Check against your Supabase compute tier's connection limit before adding instances or workers. |
| Schemas | One Postgres schema per module (`identity`, `billing`, …), **never `public`**. Do **not** add them to Supabase's exposed schemas for the Data API. |
| RLS lock-down | Every table: `ENABLE ROW LEVEL SECURITY` with **no policies**, and `REVOKE ALL` on our schemas from `anon` and `authenticated`. This is defence in depth in case the Data API is ever switched on. The backend connects with a server-side role that bypasses RLS; real authorization is enforced in the app (guards + `CustomerScope`). A CI test fails if any table in our schemas has RLS disabled. |
| Migrations | **Drizzle-kit only**, applied with `pnpm db:migrate` against `DATABASE_URL_DIRECT`. No dashboard/SQL-editor schema edits and no `supabase db push` (they cause drift). The Supabase CLI is used only to run the local stack. |
| Extensions | `citext` and `pg_trgm` created in baseline migration `0001` (`CREATE EXTENSION IF NOT EXISTS … WITH SCHEMA extensions`). Reference types as `extensions.citext` or set the search path explicitly. |
| IDs | UUIDv7 generated **in the application** (`uuidv7` package); do not rely on a database generator. |
| Jobs | **pg-boss** replaces Redis/BullMQ (schema `pgboss`). It connects via the direct/session URL. Schedules use singleton keys so several API instances never double-run billing. |
| Secrets | `DATABASE_URL*`, JWT secrets, SMTP credentials live only in backend env / a secret manager. Frontend env contains only `VITE_API_BASE_URL`. No Supabase keys anywhere in the frontend. |
| Hosting | Supabase does not host the Node app (Edge Functions are Deno and unsuited to a long-lived API + worker). Ship the backend as a container to any host (Render, Railway, Fly.io, Cloud Run, …) and the frontend as a static build on any static host/CDN. |
| Environments | `local` (Supabase CLI stack) · `staging` (separate Supabase project) · `production` (separate project). Local must never point at a hosted project. |
| Test DB | Integration tests use Testcontainers with a Postgres image matching your Supabase major version (Supabase's own `supabase/postgres` image if you want identical extensions). |
| Production plan | Pick a plan that does not auto-pause, with daily backups; add point-in-time recovery for a billing system. Verify current tier limits (connections, storage, compute) before launch. |

---

## 2. Backend Architecture — Modular Monolith

One deployable NestJS application. Internally split into **modules that own their data and expose only a public facade**. A module could later be extracted into a service without rewriting callers.

### 2.1 Repository layout

```text
brightloop/
├── AGENTS.md                         # standing instructions for every agent (read automatically)
├── .agents/
│   ├── rules/                        # topic rules, each < 12,000 chars
│   │   ├── 00-architecture.md
│   │   ├── 10-backend-conventions.md
│   │   ├── 20-frontend-utilitarian.md
│   │   ├── 30-testing.md
│   │   ├── 40-money-and-state-machines.md
│   │   └── 50-supabase-postgres.md        # pooler rules, RLS lock-down, schemas, no Supabase Auth
│   ├── skills/
│   │   ├── new-backend-module/SKILL.md
│   │   ├── add-endpoint/SKILL.md
│   │   ├── add-state-machine/SKILL.md
│   │   └── add-ui-screen/SKILL.md
│   └── workflows/                    # slash-command workflows
│       ├── phase-start.md            # /phase-start
│       ├── phase-gate.md             # /phase-gate
│       └── boundary-check.md        # /boundary-check
├── docs/
│   ├── IMPLEMENTATION_PLAN.md
│   ├── requirements/Subscription_Management_System.pdf
│   ├── adr/                          # architecture decision records
│   ├── domain/                       # glossary, state diagrams, pricing/tax/discount rules
│   └── api/                          # generated OpenAPI snapshot
├── backend/
│   ├── package.json
│   ├── drizzle.config.ts
│   ├── .dependency-cruiser.cjs       # enforces module boundaries in CI
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts             # wires modules only; no business logic
│   │   ├── shared/                   # SHARED KERNEL (no business rules)
│   │   │   ├── config/               # env schema, typed config
│   │   │   ├── database/             # drizzle client (Supabase pooler), tx helper, migration runner (direct URL)
│   │   │   ├── errors/               # DomainError, problem+json filter
│   │   │   ├── events/               # typed in-process event bus (post-commit)
│   │   │   ├── money/                # Money value object, rounding, formatting
│   │   │   ├── pagination/           # cursor/offset helpers, filter parsing
│   │   │   ├── security/             # guards, @Roles, @CurrentUser, CustomerScope
│   │   │   ├── state-machine/        # tiny generic FSM helper
│   │   │   ├── queue/                # pg-boss setup (direct/session URL)
│   │   │   └── testing/              # factories, test DB bootstrap
│   │   └── modules/
│   │       ├── identity/             # auth, users, staff, password reset, roles
│   │       ├── customers/            # customer profiles (with or without portal login)
│   │       ├── catalog/              # products, variants
│   │       ├── plans/                # plans, billing periods, plan flags
│   │       ├── taxation/             # tax rules + tax calculator
│   │       ├── discounts/            # discount rules, eligibility engine, redemptions
│   │       ├── subscriptions/        # quotation templates, subscriptions, lifecycle, payment terms
│   │       ├── billing/              # invoices, billing runs, numbering, PDF/print, send
│   │       ├── payments/             # payment records, receivables status
│   │       ├── reporting/            # read-only dashboards and summaries
│   │       ├── notifications/        # email templates + dispatch
│   │       └── audit/                # append-only audit log
│   ├── migrations/                   # generated SQL, committed
│   └── test/                         # cross-module integration + e2e API tests
├── frontend/
│   ├── package.json
│   ├── tailwind.config.ts            # utilitarian tokens
│   └── src/
│       ├── app/                      # router, providers, auth guard, layouts
│       ├── design-system/            # tokens.css + primitives (§3)
│       ├── features/                 # one folder per backend module (api hooks + screens)
│       │   ├── auth/ catalog/ plans/ taxes/ discounts/ templates/
│       │   ├── subscriptions/ invoices/ payments/ customers/ staff/
│       │   ├── reports/ portal/
│       └── lib/                      # http client, formatters, permissions
├── supabase/                         # Supabase CLI config for the LOCAL stack only (config.toml); no SQL migrations here
├── docker-compose.yml                # Mailpit only (local email catcher)
└── .github/workflows/ci.yml
```

### 2.2 Anatomy of every module

```text
modules/<name>/
├── <name>.module.ts          # Nest module; exports ONLY the facade
├── index.ts                  # PUBLIC API: facade, public DTO types, event types. Nothing else.
├── api/                      # controllers, request DTOs, response presenters
├── application/              # use-case services, facade implementation
├── domain/                   # entities, value objects, state machine, policies, domain events (pure TS, no Nest/DB imports)
├── infrastructure/           # drizzle schema (own Postgres schema), repositories, mappers
└── __tests__/                # unit (domain) + integration (repositories/use cases)
```

### 2.3 Boundary rules (enforced by `dependency-cruiser` in CI — a violation fails the build)

1. A module may import another module **only via its `index.ts`** (the facade). Never `../other/infrastructure/*`, never another module's tables or repositories.
2. **Each module owns a dedicated Postgres schema** (`identity.*`, `catalog.*`, `billing.*` …). Foreign keys across schemas are allowed for integrity; **cross-module joins in application code are not** — call the facade.
3. `domain/` imports nothing from Nest, Drizzle, or other modules. It is plain TypeScript and fully unit-testable.
4. Controllers contain no business logic: parse → call one application service → present.
5. Cross-module side effects use **domain events** (post-commit, in-process). Anything that must be atomic with the write (e.g. "invoice created and subscription cursor advanced") is done in **one transaction through facades that accept a transaction handle**.
6. **`reporting` is the only module allowed to read other modules' data directly**, and only through its own read-only SQL/views in `reporting/infrastructure/`. It never writes.
7. `shared/` holds no business rules. If a rule has a business name, it belongs in a module.

### 2.4 Allowed dependency direction

```text
identity ◄── (security guards used by all controllers)
customers ◄── subscriptions, billing, payments
catalog   ◄── subscriptions, billing
plans     ◄── subscriptions, billing
taxation  ◄── billing            (tax calculation at invoice time; estimates in subscriptions)
discounts ◄── billing            (eligibility + redemption at invoice time)
subscriptions ◄── billing        (billing reads due subscriptions, advances cursor via facade)
billing   ◄── payments           (payments apply to invoices via BillingFacade)
notifications ◄── events from all (listens; nobody calls it directly except identity for reset email)
audit     ◄── events from all
reporting ──► read-only views over all
```

No cycles. If an agent feels it needs one, it must stop and write an ADR.

### 2.5 Domain events (initial catalogue)

`UserRegistered`, `PasswordResetRequested`, `StaffCreated`, `SubscriptionConfirmed`, `SubscriptionActivated`, `SubscriptionPaused`, `SubscriptionRenewed`, `SubscriptionClosed`, `InvoiceGenerated`, `InvoiceConfirmed`, `InvoiceSent`, `InvoiceCancelled`, `PaymentRecorded`, `InvoicePaid`, `DiscountRedeemed`.

---

## 3. Frontend Design Language — Utilitarian

**Principle:** function-first, clean, direct. Clarity over aesthetics. Rugged, military-industrial feel: grid layout, monospaced/industrial type, muted tones, **no decoration**. The interface should look like a technical manual or equipment panel, not a marketing page. Agents must treat §3 as binding for every screen.

### 3.1 Tokens (`frontend/src/design-system/tokens.css`)

```css
:root {
  /* Muted, field-equipment palette */
  --paper:        #E3E1D8;  /* page background — concrete/khaki */
  --surface:      #EDECE5;  /* panels, table rows */
  --surface-alt:  #D6D4C9;  /* zebra rows, table headers */
  --ink:          #1B1E19;  /* primary text */
  --ink-muted:    #5A5E52;  /* secondary text, labels */
  --line:         #2A2D26;  /* strong borders */
  --line-soft:    #A8A89A;  /* hairlines */

  --olive:        #4B5236;  /* primary action */
  --olive-dark:   #333825;
  --steel:        #4A5560;  /* secondary / info */
  --amber:        #B07818;  /* warning, focus ring */
  --red:          #8E2B22;  /* error, overdue, destructive */
  --green:        #3E5B34;  /* ok, paid, active */

  --font-mono:    "IBM Plex Mono", "JetBrains Mono", ui-monospace, monospace;
  --font-sans:    "IBM Plex Sans Condensed", "Arial Narrow", sans-serif;

  --radius: 0;              /* ALWAYS zero */
  --grid: 8px;              /* base spacing unit */
}
```

Fonts are **self-hosted via `@fontsource`** — no CDN.

### 3.2 Hard rules

| Rule | Spec |
|---|---|
| Shape | `border-radius: 0` everywhere. 1 px solid borders. **No shadows, gradients, blur, glassmorphism, illustrations, emoji.** |
| Layout | 12-column grid, 8 px base unit, fixed 224 px left rail, content max-width fluid. Dense: table row height 28–32 px. |
| Type | Data, IDs, numbers, status, labels → **monospace**. Headings → condensed sans, uppercase, tracked. Base size 13 px. Numbers use `tabular-nums` and are **right-aligned**. |
| Colour | Muted palette only. Colour carries **meaning** (state), never decoration. Never rely on colour alone — pair with text. |
| Navigation | Text-only, numbered rail: `01 SUBSCRIPTIONS`, `02 INVOICES`… Active item = solid `--ink` block with `--paper` text. |
| Status | Bracketed uppercase tags: `[DRAFT] [QUOTATION] [CONFIRMED] [ACTIVE] [PAUSED] [CLOSED] [PAID] [OVERDUE] [CANCELLED]` with a 8 px square marker. |
| Forms | Label above field, uppercase 11 px `--ink-muted`. Rectangular inputs, 1 px `--line` border, 32 px height. Inline error text under the field: `ERR · password: needs a special character`. |
| Buttons | Rectangular. Primary = solid `--olive`. Secondary = 1 px outline. Destructive = solid `--red`. No icon-only buttons without a text label/tooltip. |
| Icons | Avoid. If needed: 16 px, 1.5 px stroke, square caps, single colour. Prefer text glyphs (`+`, `×`, `▲`, `▼`). |
| Motion | **None.** No transitions, skeleton shimmer, or animated charts. Loading = text `LOADING…`. |
| Empty / error | Plain text: `NO RECORDS.` / `ERR 500 · REQUEST FAILED · RETRY`. |
| Focus | 2 px solid `--amber` outline, 2 px offset. Fully keyboard-operable. |
| Charts | Avoid libraries. Use tables first; at most simple SVG bar/line with 1 px strokes, labelled axes, no gradients. |
| Print | Invoice and quotation have a dedicated print stylesheet — document-like, monochrome, boxed table. |
| Responsive | Desktop-first for staff/admin. Customer portal collapses to a single column down to 360 px. |
| Accessibility | WCAG AA contrast, visible focus, semantic tables, `aria-live` on status changes. |

### 3.3 Design-system primitives (built in Phase 0, reused everywhere)

`AppShell`, `NavRail`, `PageHeader`, `Panel`, `DataTable` (sort, filter row, keyset pagination, column visibility, CSV export), `FilterBar`, `StatusTag`, `Field`, `TextInput`, `NumberInput`, `Select`, `DateInput`, `Button`, `Dialog` (square, bordered, no backdrop blur), `KeyValueList`, `StatBlock` (label + big monospaced number), `Timeline` (text log of state changes), `Toast` (static banner at top, no animation).

> **Agent instruction:** do not install a component library that ships rounded/shadowed defaults (MUI, Chakra, shadcn defaults). Radix **unstyled** primitives are acceptable for accessibility (dialog, select, popover) if fully restyled to these tokens.

---

## 4. Domain Rules Reference (agents: read before touching billing logic)

### 4.1 Authentication & users
- Email unique (case-insensitive, citext). One account per email.
- Password: **at least 9 characters** ("more than eight"), ≥ 1 uppercase, ≥ 1 lowercase, ≥ 1 special character. Same validator on client and server (shared rule list in `docs/domain/password-policy.md`).
- Forgot password: always respond `200` with a generic message (no email enumeration). Reset token: random 32 bytes, **stored hashed**, expires in 60 min, single-use. Link emailed to the registered address.
- Self-signup creates a `CUSTOMER` user + customer profile. **Only `ADMIN` can create `STAFF`.** No endpoint allows role escalation.
- Rate-limit login and reset endpoints.

### 4.2 Catalog & plans
- **Product:** name, type (`SERVICE | SOFTWARE | ADD_ON | PHYSICAL` — configurable list), sales price, cost price, notes, active flag.
- **Variant:** product + attribute (e.g. `Brand`) + value (e.g. `Odoo`) + **extra price** (e.g. +560). Variant line price = product sales price + variant extra price.
- **Plan:** name, price, billing period (`DAILY | WEEKLY | MONTHLY | YEARLY`), minimum quantity, available-from / available-to, and four admin-controlled flags: `auto_close_on_end`, `closable`, `pausable`, `renewable`.

### 4.3 Subscription lifecycle
```text
DRAFT ──► QUOTATION ──► CONFIRMED ──► ACTIVE ──► CLOSED
                                       │  ▲
                                       ▼  │   (only if plan.pausable)
                                      PAUSED
```
- `DRAFT → QUOTATION`: quotation issued (validity from template `valid_days`).
- `QUOTATION → CONFIRMED`: customer/staff accepts; rejects if quotation expired or plan unavailable on start date.
- `CONFIRMED → ACTIVE`: on start date (daily sweep) — first invoice is generated at activation.
- `ACTIVE → CLOSED`: automatically at expiry if `auto_close_on_end`; manually any time if `closable`.
- `ACTIVE ⇄ PAUSED`: only if `pausable`. Paused subscriptions are **not billed**; billing cursor resumes on un-pause (no back-billing).
- **Renew** (only if `renewable`): extends expiry by the original term length; writes a `SubscriptionRenewed` event. Allowed from `ACTIVE`, or `CLOSED` within a grace window (configurable, default 0 = ACTIVE only).
- Every transition is validated by the state machine, written to `subscription_events` (who/when/from/to), and visible to the whole team.
- Subscription number format: `SUB-000001` (sequence-backed).

### 4.4 Billing engine (the most critical logic)
- **Selection:** `status = ACTIVE AND next_billing_date <= today AND next_billing_date <= expiry_date`.
- **Exactly-once guarantee (three layers):**
  1. Unique constraint `invoices(subscription_id, period_start)`.
  2. Per-subscription transaction: lock row (`SELECT … FOR UPDATE SKIP LOCKED`) → create invoice → advance `next_billing_date` → commit. All-or-nothing.
  3. `billing_runs` + `billing_run_items` table records outcome per subscription (`CREATED | SKIPPED_ALREADY_BILLED | FAILED(reason)`) so a crashed run can be **resumed** and a re-run is a no-op.
- **Catch-up:** if the scheduler was down for N periods, generate each missed period once (bounded by expiry), oldest first.
- **Line build:** product (+variant) lines at snapshotted unit price; optional **plan fee line** from `plan.price` (set `plan.price = 0` to bill by lines only — see Assumption A-2).
- **Order of calculation per line:** `subtotal = qty × unit_price` → apply eligible discount → apply tax rules on discounted amount → round half-up per line → sum.
- **Tax rules** (admin-defined): name, rate %, applies to (`ALL | PRODUCT_TYPE | SPECIFIC_PRODUCTS`), active dates, priority. Calculator is a **pure function**; same function produces estimates on subscription lines and final figures on invoices.
- **Discounts** (admin-only): `FIXED | PERCENTAGE`, value, `min_purchase_amount`, `min_quantity`, start/end date, `usage_limit`, `used_count`, scope = `PRODUCTS` (set of products) or `SUBSCRIPTIONS` (set of subscriptions). Auto-evaluated at invoice generation. Redemption row written **in the same transaction** as the invoice; `used_count` incremented with a row lock so the limit can never be exceeded. Stops automatically at `end_date` or when `used_count = usage_limit`. Default stacking: at most one product-scoped discount per line and one subscription-scoped discount per invoice, highest saving wins (Assumption A-4).
- **Invoice status:** `DRAFT → CONFIRMED → PAID`; `CANCELLED` from `DRAFT` or `CONFIRMED` (only if no payments). Invoice number (`INV-2026-000123`) assigned at **confirmation**, gapless per year via a locked sequence row.
- **Due date** = invoice date + payment term days (snapshotted from the subscription's payment term).
- **Actions:** confirm, cancel, send (email with PDF), print/download PDF. Bulk confirm/send for billing day.
- Invoice lines are **snapshots** (names, prices, tax rates). Later edits to products/plans/taxes never alter issued invoices.

### 4.5 Payments & receivables
- Payment: invoice, **method** (`CASH | BANK_TRANSFER | CARD | UPI | CHEQUE | OTHER`), amount, paid date, note, optional reference, recorded-by.
- Partial payments allowed; overpayment rejected. `amount_due = total − Σ payments`. When `amount_due = 0` → invoice becomes `PAID` and `InvoicePaid` is emitted.
- Payments are immutable; corrections are **reversal entries** (admin only, audited), not edits.
- `POST /payments` requires an `Idempotency-Key` header (double-click safe).
- **Overdue is derived, not stored:** `status = CONFIRMED AND due_date < today AND amount_due > 0`. Indexed with a partial index.

### 4.6 Reporting (finance lead)
Active subscription count; revenue (invoiced vs. collected) by period; outstanding amount; overdue invoices list with ageing buckets (1–30, 31–60, 61–90, 90+); payments by method; MRR / ARR derived from active subscriptions normalised to monthly. Filters: date range, customer, plan, product, status. Summary view + drill-down tables + CSV export.

---

## 5. Permission Matrix

| Capability | ADMIN | STAFF | CUSTOMER |
|---|:-:|:-:|:-:|
| Create / deactivate staff | ✔ | ✘ | ✘ |
| Products, variants, plans, taxes, discounts, payment terms, quotation templates (write) | ✔ | ✘ (read) | ✘ |
| Customers (create/edit) | ✔ | ✔ | own profile only |
| Quotations / subscriptions (create, edit, transition) | ✔ | ✔ | request pause/close/renew on own, if plan allows |
| Invoices (generate, confirm, cancel, send, print) | ✔ | ✔ | view / download own |
| Record payments | ✔ | ✔ | view own |
| Reverse a payment | ✔ | ✘ | ✘ |
| Reports | ✔ | ✔ | ✘ |
| Audit log | ✔ | ✘ | ✘ |

Customer data isolation is enforced **in the repository layer** via `CustomerScope` (every query for a customer principal is forced to `customer_id = principal.customerId`), not just in controllers. Dedicated tests prove cross-customer access returns `404`.

---

## 6. Assumptions & Open Questions

Agents proceed with the **Assumption** unless the human reviewer overrides. Record any change in an ADR.

| # | Topic | Assumption (default) |
|---|---|---|
| A-1 | Currency | Single base currency (INR), integer minor units. Multi-currency out of scope. |
| A-2 | Plan price vs. product price | `plan.price` is a recurring base fee billed as its own "Plan fee" line; product lines add `sales_price + variant extra`. Set `plan.price = 0` for line-only billing. |
| A-3 | Minimum quantity | Applies **per product line**: each line quantity ≥ `plan.min_quantity`. |
| A-4 | Discount stacking | One product-scoped per line + one subscription-scoped per invoice; highest saving wins. |
| A-5 | Proration | Out of scope. Mid-cycle changes take effect on the next billing period. |
| A-6 | Online payment gateway | Out of scope. Payments are **recorded** by staff. Portal "pay now" is a stretch goal behind a feature flag. |
| A-7 | Tax model | Tax-exclusive pricing; tax calculated on discounted amount. |
| A-8 | Finance lead role | Finance lead uses `ADMIN` or `STAFF` — both can view reports. |
| A-9 | Billing schedule | Daily billing run at 02:00 local; manual "Run now" for admin/staff. Invoices are created as `DRAFT` unless `AUTO_CONFIRM_INVOICES=true`. |
| A-10 | Staff-created customers | Customer profile can exist without a login; staff can later send a portal invite. |
| A-11 | Auth ownership | Users, passwords and reset tokens live in our own `identity` schema, not Supabase Auth (see §1.1). |
| A-12 | Language | Backend (Node.js) and frontend (React) are written in **TypeScript**, which compiles to ordinary JS. Strict typing is valuable for money and state-machine code. If you want plain JavaScript, say so and the plan switches to JSDoc types + `checkJs`. |
| A-13 | Deployment | Backend runs as a container on a host of your choice; frontend as static files; Supabase provides only the database. |

---

## 7. Agentic Development Operating Procedure (Antigravity)

> Verify against the Antigravity version you run; customization paths have changed between releases (workspace rules currently live in `.agents/rules/`, with `.agent/rules/` kept for backward compatibility).

### 7.1 Workspace setup (done in Phase 0)
- **`AGENTS.md`** at repo root — read automatically by Antigravity. Keep it short: stack, commands (`pnpm dev`, `pnpm test`, `pnpm check:boundaries`, `pnpm db:start` = `supabase start`, `pnpm db:migrate`), the five boundary rules (§2.3), the money rule, the utilitarian design rules (§3.2), and "stop and ask when requirements are ambiguous".
- **Rules** in `.agents/rules/` — one topic per file, each **under 12,000 characters** (Antigravity's per-file limit). Set `00-architecture`, `40-money-and-state-machines` and `50-supabase-postgres` to *Always On*; scope `20-frontend-utilitarian` by glob `frontend/**`; scope `10-backend-conventions` by glob `backend/**`.
- **Skills** in `.agents/skills/<name>/SKILL.md` — repeatable procedures (scaffold a module, add an endpoint with DTO + test + OpenAPI, add an FSM, add a UI screen using design-system primitives).
- **Workflows** in `.agents/workflows/` — slash commands: `/phase-start` (read this plan section, restate scope, create task list), `/phase-gate` (run all gate checks, produce a report), `/boundary-check`.

### 7.2 Session discipline
1. **One phase = one Manager-view conversation**, started in **Planning mode** so the agent produces an implementation-plan artifact **before** writing code. Review and approve that artifact; reject plans that touch modules outside the phase.
2. Agents work **task by task** (§ each phase's "Agent tasks"), committing after each task with a conventional-commit message (`feat(billing): …`).
3. **Test first for domain logic.** State machines, tax calculator, discount engine, billing selection → write failing unit tests, then implementation.
4. After each task the agent runs: `pnpm lint && pnpm typecheck && pnpm check:boundaries && pnpm test`. Red = not done.
5. For UI tasks the agent uses the **browser agent** to open the page, capture a screenshot, and self-check it against the §3.2 checklist; screenshots attach to the walkthrough artifact.
6. Each phase ends with the **Exit Gate**; the agent produces a walkthrough artifact summarising what changed, how it was verified, and anything deferred.
7. Terminal policy: allowlist `pnpm`, `docker compose`, `supabase start/stop/status`, `git status/diff/add/commit`, `drizzle-kit generate`. Require approval for anything destructive (`rm -rf`, `drop`, `git push --force`, `git reset --hard`, `supabase db reset`), for `drizzle-kit migrate` against any non-local URL, for `supabase link`/`db push`, and for any new dependency. Agents never receive production or staging credentials.

### 7.3 Choosing the model per task

| Task type | Prefer |
|---|---|
| Scaffolding, repetitive CRUD, large cross-file refactors, reading the whole repo | **Gemini Pro** (large context) |
| Billing engine, discount/tax logic, state machines, concurrency, security review, tricky test design | **Claude Sonnet** |
| Independent review of a finished phase | Use the **other** model than the one that wrote it |

### 7.4 Guard-rails agents must never break
- Never edit an applied migration — add a new one.
- Never create tables in `public`, never leave RLS disabled, never use Supabase Auth, the Data API or `supabase-js` from the frontend.
- Never use session-level DB features (prepared statements, `SET`, temp tables, session advisory locks) on the pooled connection.
- Never run a command against a hosted Supabase project without explicit human approval.
- Never import across module internals (the CI boundary check will fail it).
- Never use floats for money.
- Never skip a failing test or loosen a gate to pass.
- Never add a UI library with rounded/shadowed defaults.
- If a requirement is ambiguous, **stop, list the options, and ask** — don't guess in billing code.

---

## 8. Phases

Effort key: **S** ≈ 1 agent session · **M** ≈ 2–3 · **L** ≈ 4+.

---

### Phase 0 — Agent Workspace, Skeleton & Design System  ·  M

**Goal:** a running empty system with CI, boundary enforcement, and the utilitarian design foundation, so every later phase is fast and consistent.

**Backend**
- Scaffold NestJS app, config/env validation (`DATABASE_URL`, `DATABASE_URL_DIRECT`, `DB_POOL_MAX`), Drizzle client on the **pooled** Supabase URL (`prepare: false`), migration runner on the **direct** URL, typed error filter (RFC 7807), request-id logging, `/health` (checks DB), Swagger.
- Baseline migration `0001`: extensions (`citext`, `pg_trgm`), one schema per module, `REVOKE` from `anon`/`authenticated`, and a reusable helper that enables RLS on every new table. Add the CI test that fails when any table in our schemas has RLS disabled.
- Create all 12 module folders with `index.ts`, module file, and empty layers (use the `new-backend-module` skill).
- `shared/`: `Money`, FSM helper, event bus, pagination helper, transaction helper, `Clock`, pg-boss queue bootstrap (direct/session URL).
- `.dependency-cruiser.cjs` implementing §2.3/§2.4; `pnpm check:boundaries`.

**Frontend**
- Vite + React + TS + Tailwind; `tokens.css`; self-hosted fonts.
- All primitives from §3.3 with a **`/_kit` page** showing each primitive and every status tag (this page is the visual regression anchor).
- App shell with numbered nav rail, auth-aware router skeleton, http client with problem+json handling.

**Platform**
- `supabase init` (local config only), `docker-compose.yml` (Mailpit only), `.env.example` (local Supabase URLs), GitHub Actions pipeline, `AGENTS.md`, `.agents/` rules/skills/workflows (including `50-supabase-postgres.md`), ADR-0001 (modular monolith), ADR-0002 (money as integers), ADR-0003 (Supabase as plain Postgres; no Supabase Auth; Drizzle-only migrations; pg-boss instead of Redis).

**Exit Gate**
- [ ] `pnpm db:start` + `docker compose up` + `pnpm dev` brings up API and web; `/health` is green and reports DB connectivity.
- [ ] `pnpm db:migrate` applies cleanly to an empty local Supabase database and is re-runnable (no-op the second time).
- [ ] RLS test: creating a table without RLS makes CI fail; all existing tables pass.
- [ ] Pooler check: a transaction using `SELECT … FOR UPDATE SKIP LOCKED` works through port 6543, and pg-boss starts through the direct/session URL.
- [ ] `pnpm check:boundaries` passes and **fails** when a deliberate illegal import is added (prove it, then revert).
- [ ] `/_kit` renders every primitive; screenshot shows zero radius, no shadows, monospaced data, bracketed status tags.
- [ ] CI green on an empty PR.

> **Kickoff prompt:** *"/phase-start Phase 0. Read docs/IMPLEMENTATION_PLAN.md §1–§3 (including §1.1 Supabase rules) and §7. Produce an implementation-plan artifact for the repo skeleton, CI, boundary enforcement, and the utilitarian design-system kit. Do not implement any business features."*

---

### Phase 1 — Identity, Roles & Access  ·  M  *(Scene: "A new customer signs up")*

**Goal:** secure sign-up/login/reset and role-based access with customer data isolation.

**Backend (`identity`, `customers`, `notifications`, `audit`)**
- Tables (in our own `identity` schema — deliberately **not** Supabase `auth.users`, see §1.1): `identity.users` (email `extensions.citext` unique, password_hash, role, status, customer_id nullable, timestamps), `identity.refresh_tokens`, `identity.password_reset_tokens` (hashed, expires, used_at), `customers.customers` (name, company, phone, billing address, tax id, user link).
- Endpoints: `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/forgot-password`, `/auth/reset-password`, `GET /me`; admin-only `POST/GET/PATCH /staff`.
- Password-policy validator (domain), argon2id, token rotation, login/reset rate limiting, generic responses on reset.
- Guards: `@Roles()`, `JwtAuthGuard`, `CustomerScope` helper for repositories.
- Reset email via `notifications` (Mailpit in dev). Audit events for login failures, staff creation, password reset.
- Seed: 1 admin, 2 staff, 5 customers.

**Frontend**
- Screens: Register, Login, Forgot password, Reset password, Staff management (admin), profile.
- Live password-rule checklist (text list with `[OK]`/`[--]` markers) matching server rules exactly.
- Role-aware nav: nav rail items and routes filtered by permission; unauthorised route → `ERR 403 · ACCESS DENIED`.

**Exit Gate**
- [ ] Unit tests: every password rule boundary (8 chars fails, 9 passes; missing upper/lower/special fails).
- [ ] Duplicate email (including different casing) rejected.
- [ ] Reset token: expires, single-use, stored hashed (verified by test reading the table).
- [ ] STAFF calling `POST /staff` → 403; no way to self-escalate role.
- [ ] Customer A requesting customer B's resource → 404 (test).
- [ ] Playwright: sign up → log in → log out → forgot password → reset via Mailpit link → log in with new password.

---

### Phase 2 — Catalog, Variants & Taxation  ·  M  *(Scene: "Launching a new plan" — products)*

**Goal:** admin can define everything that can be sold and how it is taxed.

**Backend (`catalog`, `taxation`)**
- `catalog.products` (name, type, sales_price, cost_price, notes, active), `catalog.product_variants` (product_id, attribute, value, extra_price, active); unique `(product_id, attribute, value)`.
- `taxation.tax_rules` (name, rate_bp [basis points], applies_to, product types / product ids, valid_from/to, priority, active).
- Pure `TaxCalculator` (domain) with table-driven tests: single tax, multiple taxes, product-type scoping, expired rule, rounding edge cases.
- Admin-write / staff-read enforced; audit on every change.
- Endpoint to preview effective price: `GET /catalog/products/:id/price?variant=…` (shows the Odoo +560 case).

**Frontend**
- Products list + detail with inline variant table (add/edit rows), Taxes list/detail, price preview panel.

**Exit Gate**
- [ ] Variant "Brand = Odoo, +560" yields `sales_price + 560` exactly (test).
- [ ] Tax calculator passes the full table of cases; no float usage anywhere (lint rule or grep check).
- [ ] Staff can read but receives 403 on write for products/variants/taxes.

---

### Phase 3 — Plans, Payment Terms & Discount Rules  ·  M  *(Scenes: "Launching a new plan", "A customer asks for a better price" — rule definition)*

**Goal:** admin can publish plans and define discount rules; the discount engine exists as a tested pure function.

**Backend (`plans`, `discounts`, payment terms inside `subscriptions`)**
- `plans.plans`: name, price, billing_period enum, min_quantity, available_from, available_to, `auto_close_on_end`, `closable`, `pausable`, `renewable`, active. Domain query `isAvailableOn(date)`.
- Payment terms (`subscriptions.payment_terms`): name, days (e.g. Immediate = 0, Net 15, Net 30), default flag.
- `discounts.discounts`: type, value, min_purchase_amount, min_quantity, start_date, end_date, usage_limit, used_count, scope; `discounts.discount_targets` (product or subscription ids); `discounts.redemptions` (discount_id, invoice_id, amount, created_at; unique per `(discount_id, invoice_id)`).
- **`DiscountEngine`** (pure): given invoice context (date, lines, subscription id, customer) returns applicable discounts and per-line/per-invoice amounts, honouring dates, limits, minimums, scope, stacking rule A-4, and never discounting below zero. Table-driven tests including "limit reached", "expired yesterday", "fixed > line amount".
- Admin-only write on discounts (explicit test for STAFF → 403).

**Frontend**
- Plans list/detail (flag toggles clearly labelled), Payment Terms, Discounts list/detail with scope picker and live "usage: 3 / 10" read-out.

**Exit Gate**
- [ ] All four billing periods can be created; availability window respected.
- [ ] Discount engine test matrix green (≥ 25 cases) and reviewed by the *other* model.
- [ ] STAFF cannot create/edit discounts.

---

### Phase 4 — Quotation Templates & Subscription Lifecycle  ·  L  *(Scene: "Turning a quote into a subscription")*

**Goal:** from template to Active subscription with full, visible lifecycle.

**Backend (`subscriptions`)**
- `quotation_templates` (name, plan_id, valid_days, lines[product, variant, qty]) — admin-write.
- `subscriptions` (number, customer_id, plan_id, start_date, expiry_date, payment_term_id, status, next_billing_date, billing_anchor, total estimates), `subscription_lines` (product, variant, qty, unit_price snapshot, tax estimate, amount), `subscription_events` (from, to, actor, at, note).
- Use cases: create from template (copies lines, sets quotation expiry = today + valid_days), create blank, edit while `DRAFT/QUOTATION`, issue quotation, confirm, activate (sweep job), pause/resume, close, renew, expire (sweep job).
- Generic FSM from `shared/state-machine` with the table in §4.3; illegal transitions → `409` with machine-readable `code`.
- Validation: plan available on start date; line qty ≥ `plan.min_quantity`; expiry > start; plan flags gate pause/close/renew.
- Sweeps (pg-boss scheduled jobs, idempotent): `CONFIRMED→ACTIVE` on start date; auto-close at expiry for `auto_close_on_end`; quotation expiry.
- Filters: status, customer, plan, date range, text search (number/customer via `pg_trgm`). Keyset pagination.

**Frontend**
- Templates list/detail; Subscription list (status filter chips as `[ACTIVE]` tags), Subscription detail: header with number + status tag, **horizontal stage tracker** (`DRAFT › QUOTATION › CONFIRMED › ACTIVE › CLOSED`, current stage inverted), lines table with totals, action buttons shown only when legal, event timeline.

**Exit Gate**
- [ ] Exhaustive FSM test: every (state, action) pair either succeeds as in §4.3 or returns 409.
- [ ] Pause rejected when `plan.pausable=false`; close rejected when `closable=false`; renew rejected when `renewable=false`.
- [ ] Creating from a template reproduces lines and sets validity correctly; expired quotation cannot be confirmed.
- [ ] Sweep jobs are idempotent (run twice → same result).
- [ ] Playwright: create from template → issue → confirm → becomes Active on start date (time-travel via test clock).

---

### Phase 5 — Billing Engine & Invoices  ·  L  *(Scene: "Billing day", plus discount auto-application)*

**Goal:** hundreds of subscriptions invoiced automatically, correctly, exactly once.

**Backend (`billing`)**
- Tables: `invoices` (number nullable until confirmed, subscription_id, customer_id, period_start/end, issue_date, due_date, status, subtotal, discount_total, tax_total, total, amount_paid, snapshot of customer details), `invoice_lines` (snapshots incl. tax rate/name, discount amount), `invoice_sequences`, `billing_runs`, `billing_run_items`. Unique `(subscription_id, period_start)`.
- `BillingRunService`: select due subscriptions in batches (`FOR UPDATE SKIP LOCKED`), process each in its **own transaction** (invoice + lines + discount redemption + cursor advance), record per-item outcome, resumable, concurrency-safe across two simultaneous runs.
- Invoice assembly composes: SubscriptionsFacade (due subs + lines), TaxCalculator, DiscountEngine; **no logic duplicated**.
- Invoice FSM: `DRAFT → CONFIRMED → PAID`, `CANCELLED`. Gapless numbering assigned on confirm.
- Actions: confirm, cancel, send (email + PDF via notifications), print/PDF (`pdfkit`), bulk confirm, bulk send. Idempotent send log.
- Scheduler: daily run via pg-boss (singleton key so multiple API instances can't double-run) + `POST /billing/runs` manual trigger (with dry-run option showing what *would* be billed).

**Frontend**
- Invoices list (filters: status, customer, period, overdue), invoice detail (document-style layout), print stylesheet, bulk-action bar with row selection, **Billing Run** screen: run now / dry-run, live counts `CREATED / SKIPPED / FAILED`, failure list with reasons and retry.

**Exit Gate**
- [ ] **Idempotency:** run the billing job twice, and two runs in parallel → exactly one invoice per (subscription, period). Test with 500 subscriptions.
- [ ] **Catch-up:** scheduler "down" for 3 periods → 3 invoices created once each, none beyond expiry.
- [ ] **Totals:** golden-file tests for invoices with taxes only, discount + tax, multiple taxes, rounding edge cases.
- [ ] **Discount behaviour:** applies automatically on the next invoice; stops after `end_date`; stops at `usage_limit` even under concurrent runs (test with limit = 1, two subscriptions).
- [ ] Paused/closed/expired subscriptions never billed.
- [ ] Confirmed invoice is immutable; later product/tax changes don't alter it.
- [ ] 1,000-subscription billing run completes in a reasonable time (document the measured figure).

---

### Phase 6 — Payments & Receivables  ·  M  *(Scene: "The money comes in")*

**Goal:** record payments against invoices; always know who has paid and who hasn't.

**Backend (`payments`)**
- `payments` (invoice_id, method, amount, paid_on, note, reference, recorded_by, idempotency_key unique, reversed_at/by nullable).
- `POST /payments` → validates invoice is `CONFIRMED`, amount ≤ amount_due, then calls `BillingFacade.applyPayment(tx, …)`; invoice flips to `PAID` when due reaches zero and emits `InvoicePaid`.
- Reversal (admin-only, reason required, audited).
- Receivables queries: outstanding per invoice/customer, overdue list with age bucket, derived overdue flag, partial index `invoices(due_date) WHERE status='CONFIRMED'`.
- Optional job: overdue reminder emails (feature-flagged).

**Frontend**
- Record Payment dialog on invoice detail (method, amount defaulting to amount due, date, note); Payments list (filter by method/date/customer); Receivables screen with tabs `OUTSTANDING | OVERDUE`, age buckets, one-click "send reminder".

**Exit Gate**
- [ ] Partial then final payment → `CONFIRMED` then `PAID`; overpayment rejected; payment on `DRAFT`/`CANCELLED` rejected.
- [ ] Duplicate request with same `Idempotency-Key` creates one payment.
- [ ] Concurrent payments on the same invoice cannot exceed the total (test).
- [ ] Overdue list matches an independent SQL oracle on seeded data.

---

### Phase 7 — Customer Portal  ·  M  *(Scene 1: "customers see only their own…", plus self-service)*

**Goal:** customers manage their own subscriptions and see invoices without emailing anyone.

**Backend**
- `/portal/*` endpoints (or customer-principal behaviour on existing endpoints) all passing through `CustomerScope`.
- Self-service actions: pause, close, renew **only if plan flags allow**, using the same use cases as staff (no duplicated logic), audited with actor = customer.
- Invoice PDF download for own invoices; payment history view.
- Staff can send a **portal invite** to a customer profile without login (A-10).

**Frontend**
- Portal layout (same utilitarian language, single-column responsive): My Subscriptions (stage tracker + actions available per plan), Subscription detail, My Invoices (status tags, due dates, `[OVERDUE]` highlighting), Invoice detail/print, Profile.
- Actions not allowed by the plan are **absent**, not disabled-and-confusing; a short text states why (`PLAN DOES NOT ALLOW PAUSE`).

**Exit Gate**
- [ ] Security suite: customer cannot read/modify another customer's subscription, invoice, payment, or PDF by id guessing (404s).
- [ ] Portal pause/close/renew obey plan flags (test per flag combination).
- [ ] Playwright (mobile viewport 390 px): login → view subscription → view invoice → download PDF.

---

### Phase 8 — Reporting & Performance  ·  M  *(Scene: "The finance lead, at the end of the month")*

**Goal:** one place for active subscriptions, revenue, payments, and overdue invoices — fast at scale.

**Backend (`reporting`)**
- Read-only SQL in `reporting/infrastructure/` (explicit exception to rule 2.3-6): KPIs (active subs, MRR/ARR, invoiced, collected, outstanding, overdue count/amount), time series (monthly revenue invoiced vs. collected), ageing buckets, payments by method, top customers by outstanding.
- All endpoints accept the same filter set (date range, customer, plan, product, status); results paginated; CSV export streamed.
- Performance work: confirm indexes (see §9), add covering/partial indexes where `EXPLAIN ANALYZE` shows scans; short-TTL (30 s) cache for dashboard KPIs; **if** p95 exceeds budget, introduce a `reporting.daily_snapshot` summary table updated by events + nightly reconcile.
- Performance harness: seed script producing **10,000 subscriptions, ~120,000 invoices, ~100,000 payments**; k6 scenarios for every list and report endpoint. Run it against the local Supabase stack **and** a hosted staging project: network round-trip and pooler overhead only show up there, so record both sets of numbers.

**Frontend**
- Dashboard: row of `StatBlock`s (ACTIVE SUBS, MRR, INVOICED, COLLECTED, OUTSTANDING, OVERDUE), summary tables, filter bar persisted in the URL, drill-down links to filtered lists, CSV export button. Optional minimal SVG trend line (no chart library).

**Exit Gate**
- [ ] k6 on seeded data: **API p95 < 300 ms** for every list/report endpoint; **page load < 2 s** (Playwright trace on dashboard, subscriptions, invoices, receivables).
- [ ] No endpoint returns unbounded rows (max page size 100 enforced).
- [ ] Dashboard figures reconcile with an independent SQL oracle on the seed dataset.
- [ ] `EXPLAIN ANALYZE` evidence for the five heaviest queries committed to `docs/perf/`.

---

### Phase 9 — Hardening, E2E & Release  ·  M

**Goal:** production-ready, demonstrable end to end.

- **Scene-by-scene E2E** (Playwright) covering the seven scenes in the PDF, using Brightloop sample data (§10).
- Security review pass (the model that did **not** write the code): authz matrix tests, OWASP top-10 checklist, dependency audit, secrets scan, security headers, CORS lock-down, cookie flags.
- Reliability: graceful shutdown, job retry/backoff + dead-letter view, structured logs, `/health` + `/ready`, DB connection pooling limits.
- Backup/restore notes, migration rollback notes, `Dockerfile`s (multi-stage), env documentation.
- **Supabase production checklist:** separate staging and production projects; SSL enforced; dedicated least-privilege DB role for the API (not the owner role); RLS verification query run against production; Data API exposed-schemas list contains none of our schemas; daily backups confirmed (PITR if available); plan does not auto-pause; connection limit vs. `DB_POOL_MAX × instances` calculated; DB network restrictions enabled where available; migrations applied via CI from `DATABASE_URL_DIRECT`, never by hand.
- Docs: README quick start, admin guide, API docs snapshot, runbook ("billing run failed", "re-run safely").
- Cleanup: remove dead code, close deferred items list from walkthrough artifacts.

**Exit Gate (release)**
- [ ] Full CI green including E2E and k6 smoke.
- [ ] Traceability matrix (§11) fully checked.
- [ ] Fresh clone → `docker compose up` → seeded demo works following the README only.

---

## 9. Data Model & Index Cheat-Sheet

Money columns are `BIGINT` minor units. Primary keys are UUIDv7 (time-ordered), generated in the application. Every table has RLS enabled with no policies (§1.1). All tables have `created_at`, `updated_at`.

| Schema | Key tables |
|---|---|
| `identity` | users, refresh_tokens, password_reset_tokens |
| `customers` | customers |
| `catalog` | products, product_variants |
| `plans` | plans |
| `taxation` | tax_rules |
| `discounts` | discounts, discount_targets, redemptions |
| `subscriptions` | quotation_templates, quotation_template_lines, subscriptions, subscription_lines, subscription_events, payment_terms |
| `billing` | invoices, invoice_lines, invoice_sequences, billing_runs, billing_run_items, document_send_log |
| `payments` | payments |
| `audit` | audit_log (append-only) |
| `pgboss` | managed by pg-boss (do not hand-edit) |

**Indexes that must exist (verify in Phase 8):**
- `subscriptions(next_billing_date) WHERE status = 'ACTIVE'` — billing selection
- `subscriptions(status, customer_id)`, `subscriptions(plan_id)`, `subscriptions(expiry_date)`
- `UNIQUE invoices(subscription_id, period_start)` — exactly-once
- `invoices(due_date) WHERE status = 'CONFIRMED'` — overdue/outstanding
- `invoices(customer_id, issue_date DESC)`, `invoices(status, issue_date DESC)`
- `payments(invoice_id)`, `payments(paid_on)`, `UNIQUE payments(idempotency_key)`
- `GIN (… gin_trgm_ops)` on subscription number / customer name for search
- `UNIQUE users(email)` on `citext`

---

## 10. Seed & Demo Data

- **Dev seed:** 1 admin, 2 staff, 20 customers, ~8 products (incl. a variant product with Brand = Odoo +560), plans across all four periods, 3 tax rules, 3 payment terms, 4 discounts (one expiring, one near its usage limit), ~60 subscriptions across all statuses, invoices in every status, payments of every method.
- **Perf seed:** `pnpm seed:perf` — 10k subscriptions / ~120k invoices / ~100k payments, deterministic via fixed random seed.
- Test clock abstraction (`Clock` interface in `shared/`) so sweeps, billing, and overdue logic are time-travel testable.

---

## 11. Requirement Traceability

| Scene in the PDF | Requirement | Phase |
|---|---|---|
| A new customer signs up | Unique email, password policy, reset link | 1 |
| | Admin / Staff / Customer roles, admin-only staff creation | 1 |
| | Customer sees only own data | 1 (guards), 7 (portal) |
| Launching a new plan | Product (name, type, prices, notes) + variants (+560 example) | 2 |
| | Plan (price, period, min qty, dates, close/pause/renew flags) | 3 |
| Turning a quote into a subscription | Quotation templates with validity days | 4 |
| | Subscription number, customer, plan, dates, payment terms, lines | 4 |
| | Draft → Quotation → Confirmed → Active → Closed, visible to team | 4 |
| Billing day | Auto-created invoices, no manual typing | 5 |
| | Automatic taxes from admin rules | 2 (rules), 5 (applied) |
| | Confirm / cancel / send / print; Draft → Confirmed → Paid | 5 |
| | Never billed twice or skipped | 5 |
| A customer asks for a better price | Admin-only discount rules (fixed/%, minimums, dates, usage limit) | 3 |
| | Product or subscription scope; auto-applied; stops on expiry/limit | 3 (engine), 5 (applied) |
| The money comes in | Payment method, amount, date, note, against invoice | 6 |
| | Paid vs. outstanding visible; overdue chasing | 6 |
| The finance lead | Active subs, revenue, payments, overdue; filters + summary | 8 |
| | < 2 s pages with thousands of subscriptions | 8 (verified), all phases (budgeted) |

---

## 12. Global Definition of Done (applies to every task)

- [ ] Lint, typecheck, boundary check, unit and integration tests green.
- [ ] New endpoints have DTO validation, role guard, OpenAPI docs, and at least one permission test.
- [ ] New list endpoints are paginated (max 100), filterable, and have the required index.
- [ ] No floating-point money; no cross-module internal imports.
- [ ] Any new table lives in its module's schema (never `public`), has RLS enabled, and ships in a Drizzle migration.
- [ ] UI conforms to §3.2 (screenshot reviewed): zero radius, no shadow, monospaced data, bracketed status, keyboard operable.
- [ ] State changes are audited and, where relevant, appear in the entity's event timeline.
- [ ] Walkthrough artifact updated; deferred items listed explicitly.
