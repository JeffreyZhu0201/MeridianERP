# Phase 4 — Distributor Enhancements

**Version:** 1.0  
**Last updated:** 2025-06-25  
**Status:** Discovery complete — ready for architecture  
**Depends on:** Phase 1 (distributor CRUD, QR bind), Phase 2 (checkout attribution, commission accrual, settlement ledger)

## Problem

Phase 1 delivered distributor CRUD, QR generation, and merchant self-bind. Phase 2 added checkout attribution and commission accrual in the API. In practice, the **distributor channel is not operable end-to-end**:

- **Customers cannot bind** via the storefront (G-7): the store bind page exists but the claim flow requires merchant JWT; verify response shape does not match UI expectations; CUSTOMER QR URLs point at the merchant app, not the store.
- **Merchants lack visibility**: distributor detail shows bindings but no orders, revenue, or commission earned. Commission accrues in `CommissionLedger` but there is no merchant-facing statement or payout status.
- **QR management is minimal**: merchants can regenerate a code but cannot download assets, configure expiry, see active vs expired tokens, or generate store-scoped customer links from a clear workflow.
- **Platform oversight is incomplete** (G-3): admin dashboard hardcodes distributor and binding metrics to zero; merchant detail lacks enriched distributor summaries (G-4).

Without these capabilities, merchants cannot run real-world channel sales, distributors cannot trust attribution, and platform operators cannot monitor channel health.

## Users

| Persona | Goals |
|---------|-------|
| **Merchant Owner** | See distributor ROI, manage QR campaigns, review commission owed |
| **Merchant Staff** | Support distributors, look up binding and order attribution |
| **Distributor Agent** | Share customer QR links, understand bind and purchase outcomes (via merchant reports today) |
| **End Customer** | Scan a distributor QR, sign in, and complete binding so future purchases attribute correctly |
| **Platform Super Admin / Ops** | Monitor cross-tenant distributor adoption, bindings, and commission volume |

## User Stories

| ID | Story | Priority | Acceptance Criteria |
|----|-------|----------|---------------------|
| US-4.1 | As a **customer**, I want to bind to a distributor via the storefront QR link so that my purchases attribute commission correctly | **P0** | **Given** a valid, unexpired CUSTOMER bind token for tenant slug `S`, **When** I open `/s/S/bind/{token}` while logged out, **Then** I see the distributor name and a prompt to sign in. **Given** I am logged in with a store JWT for tenant `S`, **When** I confirm bind, **Then** a CUSTOMER binding is created with my customer ID as bindableId and I see a success state. **Given** I am already bound to another distributor, **When** I claim, **Then** I see a clear conflict message (no silent overwrite). **Given** an expired or invalid token, **When** I open the bind page, **Then** I see an error with guidance to request a new code. |
| US-4.2 | As a **merchant owner**, I want a distributor performance dashboard so that I can evaluate channel effectiveness | **P0** | **Given** I am on a distributor detail or summary view, **When** the page loads, **Then** I see at minimum: total bindings (split by MERCHANT vs CUSTOMER), attributed order count, attributed order revenue, and commission earned (ACCRUED + SETTLED). **Given** a date range filter (default: last 30 days), **When** I apply it, **Then** metrics and any trend charts update to that window. **Given** a distributor with no activity, **When** I view the dashboard, **Then** I see zero-state copy, not errors or loading spinners indefinitely. |
| US-4.3 | As a **merchant owner**, I want commission statements and payout visibility so that I know what I owe distributors | **P0** | **Given** PAID orders with distributor attribution, **When** I open commission statements, **Then** I see line items with order reference, distributor, order amount, commission rate/type, commission amount, status (ACCRUED / SETTLED), and date. **Given** a distributor filter, **When** I select one distributor, **Then** only their entries appear with a running total. **Given** entries already included in a platform settlement batch, **When** I view them, **Then** status shows SETTLED and batch reference is visible (read-only). **Given** no commission entries, **When** I open statements, **Then** I see an empty state explaining that commission appears after PAID attributed orders. |
| US-4.4 | As a **merchant owner**, I want to manage distributor QR links so that I can run secure, trackable campaigns | **P0** | **Given** a distributor, **When** I generate a QR for bind type MERCHANT or CUSTOMER, **Then** the link targets the correct portal (merchant bind vs store bind under tenant slug). **Given** an active QR, **When** I choose regenerate, **Then** a new token is issued, the previous token is invalidated, and expiry is shown. **Given** a generated QR, **When** I download, **Then** I receive a PNG (or SVG) suitable for print and social sharing. **Given** QR settings, **When** I set expiry (within allowed bounds, default 7 days), **Then** new tokens use that duration. **Given** past QR generations, **When** I view QR history, **Then** I see created date, bind type, expiry, and active/expired/revoked status. |
| US-4.5 | As a **platform admin**, I want distributor metrics on the dashboard so that I can monitor channel adoption | **P0** | **Given** I am logged in as platform admin, **When** I open the admin home dashboard, **Then** I see live counts for: total distributors (all tenants), bindings in the last 30 days, and commission accrued in the last 30 days (platform-wide). **Given** I open a merchant detail page, **When** distributors exist for that tenant, **Then** I see distributor list with binding count and recent activity summary (not empty placeholders). **Given** the dashboard API is unavailable, **When** the page loads, **Then** I see an error state — not hardcoded zeros (G-3). |
| US-4.6 | As a **merchant owner**, I want notifications when bindings or attributed orders occur so that I can respond quickly | **P1** | **Given** email notifications are enabled for my tenant, **When** a new binding is created for any distributor, **Then** the merchant owner receives an email with distributor name, bind type, and timestamp. **Given** an order is PAID with distributor attribution, **When** commission accrues, **Then** the merchant owner receives an email with order ID, distributor, and commission amount. **Given** in-app notifications, **When** I open the merchant portal, **Then** I see a recent-activity feed or badge for unread distributor events (last 7 days). |
| US-4.7 | As a **merchant staff**, I want attributed orders visible on distributor and order views so that I can resolve disputes | **P1** | **Given** a distributor detail page, **When** bindings exist, **When** I expand a CUSTOMER binding, **Then** I see linked order count and last order date if any. **Given** merchant orders list (G-11), **When** I view an order, **Then** distributor name and commission amount appear when attributed. |
| US-4.8 | As a **merchant owner**, I want separate QR workflows for merchant vs customer acquisition so that links never land on the wrong portal | **P1** | **Given** I choose "Customer QR" on distributor detail, **When** QR is generated, **Then** URL is `{STORE_APP_URL}/s/{tenantSlug}/bind/{token}` with bindType CUSTOMER. **Given** I choose "Merchant / partner QR", **When** QR is generated, **Then** URL is `{MERCHANT_APP_URL}/bind/{token}` with bindType MERCHANT. **Given** I copy or share the link, **Then** the bind type is labeled in the UI to prevent mix-ups. |
| US-4.9 | As a **merchant owner**, I want distributor tiers or hierarchy so that I can model sub-agents and override rates | **P2** | **Given** a parent distributor, **When** I assign a child distributor, **Then** child inherits or overrides commission per tier rules. **Given** a customer bound to a child, **When** checkout completes, **Then** commission splits per configured hierarchy (parent/child shares). *Deferred — requires domain model extension.* |
| US-4.10 | As a **distributor agent**, I want a self-service portal to view my bindings and earnings | **P2** | **Given** distributor login credentials, **When** I authenticate, **Then** I see my bindings, orders, and commission summary read-only. *Deferred — new auth realm; out of Phase 4 MVP.* |

### Cross-reference: known gaps addressed

| Gap | Story |
|-----|-------|
| G-7 Store customer bind broken | US-4.1, US-4.8 |
| G-3 Admin dashboard distributor metrics | US-4.5 |
| G-4 Admin merchant detail distributors empty | US-4.5 |
| G-11 Merchant orders UI (distributor column) | US-4.7 |
| Phase 2 US-2.4 UI delivery | US-4.1 |

## Non-Goals

- **Real payout rails** — bank transfers, Stripe Connect, or automated disbursement (export and status visibility only; platform settlement export remains admin-owned per Phase 2)
- **Distributor self-service portal** (US-4.10) — separate auth realm; P2
- **Multi-level hierarchy and split commissions** (US-4.9) — P2 unless explicitly pulled into a later sprint
- **SMS / push notifications** — email and in-app feed only in Phase 4
- **Fraud detection** — duplicate bind abuse, QR farming analytics beyond basic counts
- **Re-binding or bind transfer** — changing distributor after initial bind remains out of scope unless architect proposes a safe migration path
- **Commission rule engine** — tiered rates, product-category overrides, promotional bonuses
- **White-label distributor microsites**

## Success Metrics

| Metric | Target |
|--------|--------|
| Store customer bind success rate (valid token → binding created) | ≥ 95% |
| CUSTOMER QR → attributed checkout conversion (bound customers who complete ≥1 PAID order within 30d) | Baseline established; ≥ 10% within 90 days of launch |
| Merchant adoption: tenants with ≥1 distributor viewing performance dashboard monthly | ≥ 60% of tenants with active distributors |
| Commission statement accuracy vs API ledger | 100% row match in reconciliation spot-checks |
| QR regenerate + download task completion time | < 30 seconds median |
| Admin dashboard metric freshness | Data no older than 5 minutes (or real-time on load) |
| P0 acceptance criteria covered by automated tests | 100% mapped (API e2e + Playwright bind/commission smoke) |

## Dependencies on Architecture

The architect should produce `docs/architecture/phase-4-distributor-enhancements.md` resolving the following **before implementation**. The PRD intentionally avoids prescribing schemas and endpoints.

1. **Store bind auth contract (G-7)** — How `POST /bindings/claim` (or equivalent) accepts store JWT (`aud: store`), resolves `customerId` and `tenantId`, and creates CUSTOMER bindings without merchant guard. Whether verify is public with enriched payload (`distributorName`, `requiresAuth`, `bindType`) or split across endpoints.

2. **QR URL routing** — Environment-driven base URLs per bind type; tenant slug resolution for store links; invalidation semantics on regenerate (single active vs history table).

3. **Commission read APIs for merchants** — Tenant-scoped query over `CommissionLedger` with filters (distributor, status, date range); aggregation for dashboard cards; relationship to existing platform settlement batches (read-only for merchants).

4. **Distributor analytics aggregation** — Whether metrics are computed on read, materialized views, or cached counters; date-range query performance at tenant scale.

5. **Platform dashboard API (G-3)** — `GET /platform/dashboard` (or extension) returning distributor, binding, and commission aggregates; merchant detail enrichment payload for `distributors` and `crmSummary` (G-4 alignment).

6. **Notification delivery** — BullMQ job types for bind-created and commission-accrued events; email template stubs; optional in-app notification store vs ephemeral feed.

7. **RBAC** — Merchant staff read-only on commission statements; owner-only on QR regenerate and expiry settings (extend Phase 1 US-12 patterns).

8. **Checkout attribution continuity** — Confirm bound CUSTOMER `distributorId` flows to cart/checkout after US-4.1; document session vs binding lookup order.

9. **Shared contracts** — DTOs and Zod schemas in `packages/shared` for verify response, performance summary, commission statement rows, QR history entries.

10. **Test strategy** — Extend `bindings.e2e-spec.ts` for CUSTOMER claim; store Playwright bind → checkout → commission path; merchant UI smoke for dashboard and statements.

## Open Questions

| # | Question | Owner |
|---|----------|-------|
| 1 | On regenerate, revoke all prior tokens or only same bindType? | Architect |
| 2 | Max QR expiry cap (7d default — allow 1–90d per tenant)? | Product |
| 3 | Should merchants mark commission entries as "paid out" locally, or only reflect platform SETTLED status? | Product |
| 4 | In-app notifications: persistent inbox vs dashboard widget only for P1? | Product / UI |
| 5 | Performance dashboard: per-distributor page only, or also tenant-wide "Distributors" summary row on merchant home? | UI designer |
| 6 | Email notifications: merchant owner only, or configurable recipient list? | Product |
| 7 | Pull US-4.9 hierarchy into Phase 4 if a pilot tenant requires sub-distributors? | Stakeholder |

## Related Documents

| Document | Path |
|----------|------|
| Platform overview & gaps | `docs/prd/platform-overview.md` |
| Phase 1 distributors & QR | `docs/prd/phase-1-foundation.md` |
| Phase 2 attribution & commission | `docs/prd/phase-2-ecommerce.md` |
| Phase 1 architecture (bindings) | `docs/architecture/phase-1-foundation.md` |
| Phase 2 architecture (commission) | `docs/architecture/phase-2-ecommerce.md` |
| Merchant distributor UI | `apps/merchant/app/distributors/` |
| Store bind UI | `apps/store/app/s/[slug]/bind/[token]/` |
