# Merchant AI Efficiency — Design

**Version:** 1.0.0

## Screens

### `/inventory/alerts`

- `InventoryAiReplenishmentPanel` above `LowStockAlertsTable`
- Read-only Card with urgency badges and link to `/inventory/procurement`

### `/catalog/products` — edit Sheet

- `ProductCopyAiPanel` below variant fields
-「采纳标题」「采纳描述」update form state; Save persists via existing API

## Components

| Component | Props |
|-----------|-------|
| `InventoryAiReplenishmentPanel` | `token` |
| `ProductCopyAiPanel` | `token`, `productId?`, `draft`, `onAdoptTitle`, `onAdoptDescription` |

## i18n

- `merchant.inventory.ai.*`
- `merchant.catalog.ai.*`

## Visual pattern

Matches `CrmAiFollowUpPanel`: `Card` + `IconSparkles` + action Badge + generate button.
