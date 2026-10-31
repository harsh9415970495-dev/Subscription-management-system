---
name: add-ui-screen
description: Procedure for creating a utilitarian UI screen using design-system primitives
---

# Adding a Utilitarian UI Screen

## Procedure
1. **Use Design-System Primitives Only:**
   - Compose pages using primitives from `frontend/src/design-system/`:
     - `AppShell`, `PageHeader`, `Panel`, `DataTable`, `FilterBar`, `StatusTag`, `Field`, `TextInput`, `Button`, `StatBlock`.
   - Never import external styling libraries with rounded or shadowed defaults.
2. **Adhere Strictly to §3.2 Rules:**
   - Zero radius (`--radius: 0`) on every element.
   - Monospaced typography for all data, numbers (right-aligned), IDs, and tags.
   - Condensed sans uppercase for headings.
   - Bracketed status tags (e.g., `[DRAFT]`, `[ACTIVE]`).
   - Muted technical color palette.
3. **Data Fetching:**
   - Use TanStack Query (`useQuery`, `useMutation`).
   - Handle RFC 7807 problem details in error banners (`ERR · <detail>`).
   - Loading states must display plain static text `LOADING…`.
4. **Visual Regression Verification:**
   - Use the browser agent to open the screen, capture a screenshot, and verify compliance against §3.2.
