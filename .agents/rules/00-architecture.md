---
description: Modular monolith architecture rules, schema isolation, and dependency boundaries
alwaysApply: true
---

# Architecture Rules: Modular Monolith

## 1. Modular Monolith Principles
- The application is a single deployable NestJS monolith internally divided into isolated modules.
- Each module represents a cohesive domain capability (`identity`, `customers`, `catalog`, `plans`, `taxation`, `discounts`, `subscriptions`, `billing`, `payments`, `reporting`, `notifications`, `audit`).

## 2. Directory Layout per Module
Every module in `backend/src/modules/<name>/` strictly follows this structure:
```text
modules/<name>/
├── <name>.module.ts       # Nest module definition (exports ONLY the facade)
├── index.ts               # Public interface: Facade class, public DTOs, domain event types
├── api/                   # REST controllers, request DTOs, response presenters
├── application/           # Application use-case services, facade implementation
├── domain/                # Entities, value objects, state machines, domain events (pure TypeScript)
├── infrastructure/        # Drizzle schema (dedicated Postgres schema), repositories, mappers
└── __tests__/             # Unit tests (domain) and integration tests (repositories/services)
```

## 3. Boundary & Communication Rules
1. **Public Facade Only:** A module may ONLY import another module through its root `index.ts`. Never import internal paths (`../other/domain/...` or `../other/infrastructure/...`).
2. **Postgres Schema per Module:** Each module owns its dedicated schema (`identity.*`, `catalog.*`, `billing.*`, etc.), **never `public`**.
3. **No Cross-Schema Application Joins:** Never execute SQL joins across module schemas in application code. Foreign keys are allowed for referential integrity, but cross-module data retrieval must call the module's facade.
4. **Pure Domain:** The `domain/` directory must contain zero dependencies on NestJS, Drizzle ORM, or database libraries. It must be testable in pure TypeScript.
5. **Thin Controllers:** Controllers parse inputs, validate DTOs, delegate directly to one application service, and return a presenter DTO. No business logic in controllers.
6. **Cross-Module Side Effects:** Use typed domain events dispatched post-commit via the in-process event bus. If atomic consistency is required (e.g., generating an invoice and advancing billing date), execute inside a single transaction using facades that accept a transaction handle.
7. **Reporting Read Exception:** The `reporting` module is strictly read-only. It is the only module allowed to query across schemas directly via its own reporting SQL views.
8. **Shared Kernel Restrictions:** `shared/` contains technical utilities (`Money`, FSM helper, pagination, clock, RFC 7807 errors). No domain rules live in `shared/`.
