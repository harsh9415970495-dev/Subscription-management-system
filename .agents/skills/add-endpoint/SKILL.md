---
name: add-endpoint
description: Procedure for adding an API endpoint with DTO validation, role guard, OpenAPI, and tests
---

# Adding a New API Endpoint

## Procedure
1. **Define Request & Response DTOs:**
   - In `api/dto/`, create request DTO using `class-validator` decorators.
   - Annotate all fields with `@ApiProperty()`.
2. **Implement Application Service:**
   - In `application/`, implement the use-case logic or call the domain entity.
   - Enforce domain invariants and throw `DomainError` on violations.
3. **Add Controller Method:**
   - In `api/<module>.controller.ts`:
     - Apply `@Roles('ADMIN', ...)` guard.
     - Add Swagger annotations (`@ApiOperation`, `@ApiResponse`).
     - Parse input and delegate immediately to the application service.
4. **Write Integration Test:**
   - In `__tests__/`, write an integration test verifying:
     - 200/201 on valid input.
     - 400 Bad Request on invalid DTO.
     - 403 Forbidden for unauthorized roles.
5. **Verify OpenAPI:**
   - Confirm new endpoint appears in Swagger docs at `/api/docs`.
