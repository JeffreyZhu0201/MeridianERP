# Merchant AI Efficiency — PRD

**Version:** 1.0.0  
**Updated:** 2026-07-07

## Problem

Merchants see low-stock alerts but lack guidance on replenishment priority and quantity. Product descriptions are often written manually, especially when localizing HQ-supplied SKUs.

## Users

| User                             | Portal          | Need                                                   |
| -------------------------------- | --------------- | ------------------------------------------------------ |
| Branch / flagship merchant staff | `apps/merchant` | AI replenishment suggestions on low-stock page         |
| Branch / flagship merchant staff | `apps/merchant` | AI product copy in edit sheet with one-click form fill |

## User Stories (P0)

### US-MAI1 — Replenishment suggestions on alerts page

**Given** I am on `/inventory/alerts` with low-stock SKUs  
**When** I open the page (or click「生成建议」)  
**Then** I see the latest saved analysis or freshly generated read-only summary, priorities (urgency + suggested qty), and recommendations

### US-MAI1b — Replenishment analysis history

**Given** I have generated replenishment suggestions before  
**When** I expand an item in the analysis history section  
**Then** I can review that past suggestion (read-only)

### US-MAI1c — Streaming replenishment output

**Given** I click「生成建议」on `/inventory/alerts`  
**When** the AI runs  
**Then** summary and priorities appear incrementally via SSE until complete

### US-MAI1d — Procurement cart prefill from latest analysis

**Given** I have a saved replenishment analysis with mappable HQ SKUs  
**When** I click「AI 一键预填」on `/inventory/procurement`  
**Then** matching lines merge into my cart (quantities summed per SKU)  
**And** I still submit the order manually

**Given** no latest analysis exists  
**When** I click prefill  
**Then** I am prompted to generate analysis on the alerts page first

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
