# ADR-0002: Representation of Money as Integer Minor Units

## Status
Accepted

## Context
Subscription management, invoicing, tax calculations, and payment tracking require exact precision. IEEE 754 floating-point arithmetic (standard JavaScript `number`) introduces rounding anomalies (e.g. `0.1 + 0.2 !== 0.3`) which are unacceptable in financial systems.

## Decision
Represent all monetary values strictly as **integers in minor units** (e.g. paise for INR: ₹100.50 = `10050` paise):
1. In PostgreSQL: Stored as `BIGINT`.
2. In TypeScript: Encapsulated within a pure `Money` value object (`shared/money/Money.ts`).
3. Single base currency (`INR`).
4. Line-item calculations use half-up rounding on integer minor units.
5. Floating point numbers are banned in financial calculations and verified by lint rules and tests.

## Consequences
- **Positive:** Guaranteed arithmetic accuracy, eliminates precision drift and balance discrepancies.
- **Negative:** Requires explicit conversion when formatting for display on the UI or reading user inputs.
