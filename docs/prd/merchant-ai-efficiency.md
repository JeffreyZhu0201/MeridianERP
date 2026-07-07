# Merchant AI Efficiency — PRD

**Version:** 1.0.0  
**Updated:** 2026-07-07

## Problem

Merchants see low-stock alerts but lack guidance on replenishment priority and quantity. Product descriptions are often written manually, especially when localizing HQ-supplied SKUs.

## Users

| User | Portal | Need |
|------|--------|------|
| Branch / flagship merchant staff | `apps/merchant` | AI replenishment suggestions on low-stock page |
| Branch / flagship merchant staff | `apps/merchant` | AI product copy in edit sheet with one-click form fill |

## User Stories (P0)

### US-MAI1 — Replenishment suggestions on alerts page

**Given** I am on `/inventory/alerts` with low-stock SKUs  
**When** I click「生成建议」  
**Then** I see read-only summary, priorities (urgency + suggested qty), and recommendations

### US-MAI2 — Product copy in edit sheet

**Given** I am editing a product in `/catalog/products`  
**When** I click「生成文案」and then「采纳标题」or「采纳描述」  
**Then** the form fields update but I must click Save to persist

### US-MAI3 — Draft mode for new products

**Given** I am creating a new product with at least a name or SKU  
**When** I generate copy from the sheet  
**Then** suggestions are based on draft form values

### US-MAI4 — Tenant isolation

**Given** I am tenant A  
**When** I request copy for tenant B's product id  
**Then** I receive `404`

## Out of scope

- Auto-creating purchase orders or auto-saving products
- Bulk copy on product list
- New merchant plugin code
- Sales velocity forecasting model

## Success metrics

- Suggestion in &lt; 5s (mock) or &lt; 15s (live)
- Replenishment `sources` references alert count
