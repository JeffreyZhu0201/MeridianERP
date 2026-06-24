# MeridianERP UI Spec (`@meridian/ui-spec`)

Canonical **UI constraint library** for MeridianERP. All UI design and frontend work must reference this app — **not Figma**.

Used by: `ui-designer` and `nextjs-frontend` agents (see `.cursor/rules/ui-spec.mdc`).

## What this is

| Path | Purpose |
|------|---------|
| `src/app/page.tsx` | Component showcase — allowed variants and composition patterns |
| `src/app/globals.css` | Design tokens (colors, radius, sidebar, light/dark) |
| `src/components/ui/` | shadcn/ui primitives (`base-nova` style) |
| `components.json` | shadcn config — `lucide` icons, neutral base |

## Dev server

```bash
pnpm --filter @meridian/ui-spec dev
# or
cd apps/ui-spec && pnpm dev
```

Open the showcase to preview every allowed component in light/dark mode.

## Agent workflow

1. **ui-designer** — Read showcase + tokens; write `docs/design/<feature>.md` with component mappings (e.g. `Table`, `Dialog`, `Badge variant="destructive"`).
2. **nextjs-frontend** — Implement portals using the same primitives; mirror APIs from `src/components/ui/` into `packages/ui` or app `components/ui/`.
3. **New primitive or token** — Add to ui-spec first, then propagate to `packages/ui` and portal apps.

## Stack

- Next.js App Router
- shadcn/ui (`base-nova`)
- Tailwind CSS v4
- `lucide-react` icons
- `next-themes` for dark mode

## Related docs

- `.cursor/rules/ui-spec.mdc` — agent rules
- `docs/design/design-system.md` — ERP layout and density
- `packages/ui/` — shared shells (`AdminShell`, `MerchantShell`, etc.)
