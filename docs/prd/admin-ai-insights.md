# Admin AI Insights — PRD

**Version:** 1.0.0  
**Updated:** 2026-07-07

## Problem

HQ operators reviewing withdrawals, flagship delivery orders, and funds KPIs must mentally connect multiple data sources. Context switching to `/diagnosis` is slow for in-page decisions.

## Users

| User | Portal | Need |
|------|--------|------|
| Finance / reviewer | `apps/admin` | Withdrawal approval context before approve |
| Fulfillment | `apps/admin` | Delivery queue order status explanation |
| Finance / super admin | `apps/admin` | Funds KPI breakdown narrative |

## User Stories (P0)

### US-AAI1 — Withdrawal insight in approve dialog

**Given** a PENDING withdrawal  
**When** I open approve dialog and click「生成解释」  
**Then** I see summary, findings, and recommendations grounded in commission balance

### US-AAI2 — Delivery order insight

**Given** a PAID delivery order in `/allocations`  
**When** I click「AI」on the row  
**Then** I see fulfillment guidance (ship readiness, blockers)

### US-AAI3 — Funds KPI insight

**Given** a funds detail page (`/funds/*`)  
**When** I click「生成解释」  
**Then** I see narrative for the current metric and date range

### US-AAI4 — RBAC

- Withdrawal: `SUPER_ADMIN`, `FINANCE`, `REVIEWER`
- Delivery: `SUPER_ADMIN`, `FULFILLMENT`
- Funds: `SUPER_ADMIN`, `FINANCE`

## Out of scope

- Auto-approve / auto-ship
- New admin nav item
