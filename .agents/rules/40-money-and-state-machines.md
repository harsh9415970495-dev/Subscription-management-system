---
description: Money handling rules, integer minor units, and state machine transition guarantees
alwaysApply: true
---

# Money & State Machine Invariants

## 1. Non-Negotiable Money Rules
1. **Integer Minor Units:** All monetary amounts in database columns, domain entities, and API payloads must be integers representing the smallest currency unit (e.g., paise for INR: ₹10.50 = `1050`).
2. **Never Floating Point:** Never use `number` with decimal points or JavaScript floating-point arithmetic for currency calculations.
3. **Value Object:** Always encapsulate monetary operations in the `Money` value object (`shared/money/`).
4. **Rounding Policy:** Half-up rounding, applied strictly per line item before line summation.
5. **Single Base Currency:** Configurable via environment (`BASE_CURRENCY=INR`). Multi-currency conversion is out of scope.

## 2. State Machine Rules
1. **Generic FSM Helper:** All stateful entities (`Subscription`, `Invoice`) must use the transition validator in `shared/state-machine/`.
2. **Subscription Lifecycle:**
   ```text
   DRAFT ──► QUOTATION ──► CONFIRMED ──► ACTIVE ──► CLOSED
                                          │  ▲
                                          ▼  │  (only if plan.pausable)
                                         PAUSED
   ```
   - `DRAFT → QUOTATION`: Quotation issued with validity from template `valid_days`.
   - `QUOTATION → CONFIRMED`: Customer/staff accepts; rejected if quotation expired or plan unavailable on start date.
   - `CONFIRMED → ACTIVE`: Daily sweep on start date triggers activation and first invoice generation.
   - `ACTIVE → CLOSED`: Automatically at expiry if `auto_close_on_end`; manually if `closable`.
   - `ACTIVE ⇄ PAUSED`: Only if `plan.pausable=true`. Paused subscriptions do not accrue billing periods.
   - **Renew:** Only if `plan.renewable=true`. Extends expiry by original term length.
3. **Invoice Lifecycle:**
   ```text
   DRAFT ──► CONFIRMED ──► PAID
     │           │
     ▼           ▼
     CANCELLED (only if no payments)
   ```
4. **Illegal Transitions:** Any illegal state transition must throw a `DomainError` mapped to RFC 7807 `409 Conflict`.
5. **Audit Logging:** Every state transition must record a transition event (actor, timestamp, from_state, to_state, note).
