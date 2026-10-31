---
name: add-state-machine
description: Procedure for implementing a finite state machine using the generic FSM helper
---

# Adding a Finite State Machine

## Procedure
1. **Define States & Actions:**
   - In `domain/`, define the state enum and action enum (e.g., `SubscriptionStatus`, `SubscriptionAction`).
2. **Define Transition Map:**
   - Create a typed transition matrix mapping each current state to valid actions and next states:
     ```ts
     export const subscriptionTransitions: TransitionMap<SubscriptionStatus, SubscriptionAction> = {
       DRAFT: { ISSUE_QUOTE: 'QUOTATION' },
       QUOTATION: { CONFIRM: 'CONFIRMED' },
       CONFIRMED: { ACTIVATE: 'ACTIVE' },
       ACTIVE: { PAUSE: 'PAUSED', CLOSE: 'CLOSED', RENEW: 'ACTIVE' },
       PAUSED: { RESUME: 'ACTIVE', CLOSE: 'CLOSED' },
       CLOSED: { RENEW: 'ACTIVE' },
     };
     ```
3. **Use Generic FSM Helper:**
   - Instantiate the state machine using `StateMachine` from `shared/state-machine/`.
   - On invalid transitions, throw `InvalidStateTransitionError` mapped to HTTP 409 Conflict.
4. **Guard with Plan Flags:**
   - In the application service or domain entity, verify plan capability flags (`closable`, `pausable`, `renewable`) before transitioning.
5. **Write Exhaustive Unit Test:**
   - Write table-driven unit tests testing every possible `(state, action)` pair to ensure valid transitions succeed and invalid transitions fail with 409.
