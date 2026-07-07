# Bento Grid UI Redesign

**Reference:** `packages/ui` shared bento and dashboard components  
**PRD:** `docs/prd/bento-ui-redesign.md`  
**Architecture:** `docs/architecture/bento-ui-redesign.md`

## Layout primitives

| Component | Usage |
|-----------|--------|
| `BentoDashboardFrame` | Portal home (archetype A) |
| `BentoListHeader` | 2–4 KPI tiles above list tables (B) |
| `BentoDetailHero` | Entity summary above detail sections (C) |
| `FormPageFrame` | Forms (D) — optional side tile |
| `AuthLayout` / `BindPageFrame` | Auth flows (E) |

## Portal wireframes

### Admin (`apps/admin`)

- **Dashboard:** 4-col Bento — 5 metric tiles (row 1), chart span-2 + bindings KPI (row 2), recent merchants table span-4
- **Lists (merchants, orders, settlements):** `BentoListHeader` (totals from API meta) + `ListPageFrame`
- **Detail (merchant, inventory tenant):** `BentoDetailHero` + tabbed cards

### Merchant (`apps/merchant`)

- **Dashboard:** CRM + commerce KPIs, revenue chart span-2, recent leads + activity feed tiles
- **CRM/Catalog/Inventory lists:** metric strip (record counts) + table
- **Distributor detail:** Bento hero (bindings, commission) + panels

### Store (`apps/store`)

- **`/`:** Bento picker card — combobox/search stores, empty state, remember selection
- **`/s/[slug]`:** Featured product tile span-2 + category shortcuts + product grid
- **Cart/checkout:** `FormPageFrame` (unchanged structure, ui-spec form controls)

### Distributor (`apps/distributor`)

- **`DistributorShell`:** ErpShell sidebar + locale/theme (matches admin/merchant density)
- **Dashboard:** 7 metrics in Bento + chart span-2
- **Commissions:** summary Bento header + ledger table

## Tokens

- Grid gap: `gap-4`
- Tile: `ring-1 ring-foreground/10`, `rounded-xl`
- Numbers: `tabular-nums`
- Motion: `transition-colors duration-200`; respect `prefers-reduced-motion`

## Showcase

`packages/ui` — shared bento/dashboard components and exports
