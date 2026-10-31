---
description: Testing strategies, test runner conventions, boundary checks, and coverage
---

# Testing Conventions & Quality Gates

## 1. Test-First for Domain Logic
- Pure domain logic (tax calculation, discount eligibility, subscription state transitions, billing selection) must be written test-first.
- Tests in `domain/` must be pure TypeScript unit tests with zero DB or NestJS runtime dependencies.

## 2. Test Pyramid
1. **Unit Tests (Vitest/Jest):**
   - Test domain entities, value objects, pure engines, and state machine transitions.
   - Comprehensive edge-case tables (e.g. 8-char vs 9-char passwords, rounding boundary values).
2. **Integration Tests (Supertest / Testcontainers):**
   - Test repository queries, schema constraints, unique indices, and transaction atomicity.
   - Use real PostgreSQL (local Supabase or Testcontainers) — never mock the database.
3. **End-to-End Tests (Playwright):**
   - Run complete user journeys across frontend and backend.
   - Assert visual correctness, status transitions, and role isolation.

## 3. Boundary & Quality Checks
- `pnpm check:boundaries`: Enforced via `.dependency-cruiser.cjs`. Build fails if any illegal cross-module import exists.
- `pnpm typecheck`: Strict TypeScript compilation across workspace.
- `pnpm test:rls`: Automated check ensuring every table in module schemas has RLS enabled.

## 4. Never Loosen Gates
- Never skip, comment out, or weaken a failing test or lint rule to pass a gate.
- If a gate cannot pass, stop and report the root cause.
