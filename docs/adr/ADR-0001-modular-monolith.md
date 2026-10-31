# ADR-0001: Modular Monolith Architecture

## Status
Accepted

## Context
The Brightloop Subscription Management System encompasses complex interconnected business domains: catalog, pricing, discounting, quotations, subscriptions, billing, payments, and reporting. We needed an architecture that prevents an entangled "spaghetti" codebase while avoiding the operational, deployment, and transactional complexity of distributed microservices.

## Decision
Adopt a **Modular Monolith** architecture:
1. Single deployable application (NestJS backend).
2. Code partitioned strictly into 12 domain modules.
3. Every module encapsulates its own data, application services, and domain entities.
4. Each module exposes a single public entry point: `index.ts` (the Facade pattern).
5. Cross-module imports are restricted to facades and enforced in CI using `dependency-cruiser`.
6. Each module maps to a dedicated PostgreSQL schema (`identity`, `billing`, etc.), avoiding the public schema.

## Consequences
- **Positive:** Clear architectural boundaries, maintainability, easy future extraction into microservices if warranted, ACID transactions across modules when needed.
- **Negative:** Requires strict developer and agent discipline enforced via automated CI tooling.
