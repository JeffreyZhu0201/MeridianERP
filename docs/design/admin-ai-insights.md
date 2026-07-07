# Admin AI Insights — Design

## Component

`apps/admin/app/_components/admin-ai-insight-panel.tsx`

Props: `token`, `endpoint`, `body`, `compact?`

## Embed points

| Location | Trigger |
|----------|---------|
| Withdrawals approve `Dialog` | `compact` panel with `withdrawalId` |
| `OrdersView` flagship delivery row |「AI」opens `Dialog` with `orderId` |
| 5× `/funds/*/page.tsx` | Full panel above table; `metric` + optional `from`/`to` |

## i18n

`admin.aiInsight.*` in shared admin messages.
