# Dark Mode Borders

**Reference:** `packages/ui/src/components/ui/` (canonical)  
**Tokens:** `packages/ui/styles/globals.css`  
**Date:** 2025-06-25

## Problem

Dark mode borders felt too heavy: solid 1px borders stacked with `shadow-sm` on cards, inputs, and dialogs created bright lines against near-black backgrounds.

## Principles

1. **Separation via ring, not border + shadow** — Cards, dialogs, popovers use `ring-1 ring-foreground/10` instead of `border` + `shadow-*`.
2. **Alpha hairlines for dividers** — `--border` and `--sidebar-border` in dark mode use ~8% white alpha (`0 0% 100% / 0.08`), matching ui-spec `oklch(1 0 0 / 8%)`.
3. **Decouple `--input` from `--border`** — Form controls use `--input` aligned with `--muted` (`240 3.7% 15.9%`) plus `dark:bg-input/30` fill.
4. **Shell dividers stay subtle** — Header/footer separators use `border-border/50` or rely on softened tokens.
5. **Light mode unchanged** — All changes target `.dark` tokens and dark-aware component classes only.

## Dark Mode Token Values

```css
.dark {
  --border: 0 0% 100% / 0.08;
  --sidebar-border: 0 0% 100% / 0.08;
  --input: 240 3.7% 15.9%;
}
```

Tailwind maps these via `hsl(var(--border) / <alpha-value>)` in portal `tailwind.config.ts`.

## Component Patterns

| Component | Light | Dark |
|-----------|-------|------|
| Card | `ring-1 ring-foreground/10` | same (ring adapts) |
| Dialog / Sheet / Dropdown | `ring-1 ring-foreground/10` | same |
| Input / Select / Textarea | `border border-input` | `dark:bg-input/30`, no shadow |
| Button outline | `border border-input` | `dark:border-input dark:bg-input/30` |
| Sidebar outline button | `shadow-[0_0_0_1px_hsl(var(--sidebar-border))]` | same |
| Table row | `border-b border-border` | token auto-softens |

## Accessibility

- Body text contrast ≥ 4.5:1 (unchanged).
- Non-text UI boundaries (borders, dividers) ≥ 3:1 against background.
- Focus rings (`ring-ring`) remain visible in both themes.

## Showcase

Regression reference: shared dark-mode and border primitives in `packages/ui`.
