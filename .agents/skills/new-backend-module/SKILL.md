---
name: new-backend-module
description: Procedure for scaffolding a new backend module adhering to the modular monolith pattern
---

# Scaffolding a New Backend Module

## Purpose
Follow this procedure when creating a new module in `backend/src/modules/<name>/`.

## Procedure
1. **Create Directory Structure:**
   ```text
   backend/src/modules/<name>/
   ├── <name>.module.ts
   ├── index.ts
   ├── api/
   ├── application/
   ├── domain/
   ├── infrastructure/
   └── __tests__/
   ```
2. **Define Drizzle Schema:**
   - In `infrastructure/schema.ts`, declare the dedicated Postgres schema:
     ```ts
     import { pgSchema } from 'drizzle-orm/pg-core';
     export const mySchema = pgSchema('<name>');
     ```
   - Define tables with UUIDv7 primary keys, timestamps, and integer minor units for currency.
3. **Define Domain Entities:**
   - In `domain/`, create pure TypeScript models and value objects.
   - Do NOT import anything from NestJS, Drizzle, or external modules.
4. **Implement Public Facade:**
   - In `application/<name>.facade.ts`, implement the methods exposed to other modules.
   - In `index.ts`, re-export the facade class, public DTOs, and domain event types.
5. **Register in NestJS:**
   - In `<name>.module.ts`, export ONLY the facade provider.
   - Wire the module into `backend/src/app.module.ts`.
6. **Enforce Boundaries:**
   - Run `pnpm check:boundaries` to verify no illegal cross-module internal imports exist.
