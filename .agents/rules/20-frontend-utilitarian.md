---
description: Utilitarian design system rules, tokens, typography, and component styling constraints
globs: frontend/**
---

# Frontend Design Rules: Utilitarian Language

## 1. Core Principle
Function-first, clean, direct. Clarity over aesthetics. Rugged, technical-manual feel with grid layout, monospaced typography, muted tones, and **zero decoration**. The interface should look like an industrial control panel or military technical manual.

## 2. Token Definitions (`frontend/src/design-system/tokens.css`)
- `--paper`: `#E3E1D8` (page background — concrete/khaki)
- `--surface`: `#EDECE5` (panels, table rows)
- `--surface-alt`: `#D6D4C9` (zebra rows, headers)
- `--ink`: `#1B1E19` (primary text)
- `--ink-muted`: `#5A5E52` (secondary labels)
- `--line`: `#2A2D26` (strong borders)
- `--line-soft`: `#A8A89A` (hairlines)
- `--olive`: `#4B5236` (primary action)
- `--amber`: `#B07818` (warnings, focus ring)
- `--red`: `#8E2B22` (errors, overdue, destructive)
- `--green`: `#3E5B34` (ok, active, paid)
- `--font-mono`: `"IBM Plex Mono", "JetBrains Mono", monospace`
- `--font-sans`: `"IBM Plex Sans Condensed", "Arial Narrow", sans-serif`
- `--radius`: `0` (ALWAYS zero radius everywhere)
- `--grid`: `8px` base unit

## 3. Hard Visual Constraints
1. **Zero Radius:** `border-radius: 0` on every element (buttons, inputs, panels, dialogs, tags).
2. **No Shadows or Blur:** Never use `box-shadow`, gradients, blur, backdrop-filter, illustrations, or emojis.
3. **Typography:**
   - Data, IDs, numbers, statuses, and labels must use monospaced font.
   - Headings must use condensed sans uppercase, tracked. Base size: 13px.
   - Numbers must use `tabular-nums` and be strictly right-aligned in tables and stat cards.
4. **Navigation Rail:** Text-only, numbered rail (`01 SUBSCRIPTIONS`, `02 INVOICES`, etc.). Active item is a solid `--ink` block with `--paper` text.
5. **Bracketed Status Tags:** All status tags must be uppercase and enclosed in brackets: `[DRAFT]`, `[QUOTATION]`, `[CONFIRMED]`, `[ACTIVE]`, `[PAUSED]`, `[CLOSED]`, `[PAID]`, `[OVERDUE]`, `[CANCELLED]`. Prepend an 8px square color swatch.
6. **Forms & Inputs:** Labels above inputs in uppercase 11px `--ink-muted`. Inputs are rectangular, 32px height, 1px `--line` border. Inline validation errors placed directly beneath the input: `ERR · <message>`.
7. **Buttons:** Rectangular with zero radius.
   - Primary: Solid `--olive` background, white/cream text.
   - Secondary: 1px outline border `--line`, `--ink` text.
   - Destructive: Solid `--red` background.
8. **Motion:** No animations, transitions, or skeleton shimmers. Loading states must display static text: `LOADING…`.
9. **Accessibility:** WCAG AA contrast, visible 2px solid `--amber` focus outline with 2px offset. Fully keyboard operable.
