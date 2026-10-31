# /boundary-check Workflow

## Steps
1. **Run Boundary Enforcement:**
   ```bash
   pnpm check:boundaries
   ```
2. **Verify Rules:**
   - No module imports another module's internal files.
   - All cross-module interactions occur via `index.ts` facades.
   - Domain layer has zero external or framework dependencies.
3. **If Boundary Violation Occurs:**
   - Stop and refactor the code to respect module facades or extract shared contracts.
