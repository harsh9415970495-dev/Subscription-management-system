# /phase-gate Workflow

## Steps
1. **Execute All Quality Gates:**
   ```bash
   pnpm lint
   pnpm typecheck
   pnpm check:boundaries
   pnpm test
   ```
2. **Execute Phase-Specific Gate Checks:**
   - Run integration tests, RLS tests, and domain invariants.
3. **Capture UI Screenshots (if UI work was done):**
   - Use browser agent to take screenshots and audit against §3.2 (zero radius, monospaced data, bracketed tags).
4. **Draft Walkthrough Artifact:**
   - Summarize what was built, include evidence for each exit-gate checkbox, list any deviations or deferred items.
5. **Human Approval:**
   - Stop and wait for human review before proceeding to the next phase.
