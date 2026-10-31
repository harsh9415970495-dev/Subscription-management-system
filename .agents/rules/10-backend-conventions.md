---
description: Backend conventions for NestJS, DTOs, controllers, services, and error handling
globs: backend/**
---

# Backend Conventions

## 1. NestJS Structure & DI
- Keep modules clean and decoupled. Every module registers its controllers and services, and exports **only** its public facade.
- Inject dependencies using constructor injection. Avoid service locators or circular dependencies (`forwardRef` is forbidden; design events or facades instead).

## 2. API Edge & DTO Validation
- All incoming requests must be validated using `class-validator` and `class-transformer` decorators on explicit DTO classes.
- Use `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`.
- All endpoints must include OpenAPI decorators (`@ApiOperation`, `@ApiResponse`, `@ApiTags`, `@ApiBearerAuth`) for Swagger documentation at `/api/docs`.

## 3. RFC 7807 Error Responses
- Errors must conform to RFC 7807 Problem Details (`application/problem+json`).
- Fields:
  - `type`: URI reference identifying the problem type.
  - `title`: Short human-readable summary.
  - `status`: HTTP status code (integer).
  - `detail`: Explanation specific to this occurrence.
  - `instance`: Request URI.
  - `code`: Machine-readable error code (e.g. `ERR_QUOTATION_EXPIRED`, `ERR_INVALID_TRANSITION`).
- Use the global `ProblemDetailsFilter` in `shared/errors/` to map `DomainError` and HTTP exceptions automatically.

## 4. Security & Context
- Authentication: Backend-owned JWT access token (15m expiry) + refresh token (httpOnly cookie).
- Use `@Roles('ADMIN', 'STAFF', 'CUSTOMER')` guard for role-based authorization.
- Use `@CurrentUser()` parameter decorator to extract the authenticated user principal.
- Use `CustomerScope` in repository queries: whenever the principal is a `CUSTOMER`, force queries to filter by `customer_id = principal.customerId`.

## 5. Transactions & Concurrency
- Operations modifying multiple tables or requiring atomic cursor advancement must run inside an explicit transaction.
- Use `SELECT ... FOR UPDATE SKIP LOCKED` for worker queues or billing job selection to prevent concurrent double-processing.
- Do not use prepared statements, temporary tables, or session-level advisory locks on the pooled connection (port 6543). Use `pg_advisory_xact_lock` for transaction-scoped locks.
