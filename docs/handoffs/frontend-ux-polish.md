# Handoff: Frontend UX Polish — Implementation

**Agent:** nextjs-frontend  
**Date:** 2026-07-04  
**Branch:** feature/admin-rbac-roles

## Scope

Optimize existing frontend pages for information display and user interaction — no new features.

## Changes

### Cross-portal
- `<Toaster />` in admin, merchant, store, distributor root layouts

### Merchant
- Commissions: metric strip placement, pagination, removed broken distributor filter
- Orders: status/date i18n, pickup verify toast
- CRM details: BentoDetailHero + cross-links (contacts, companies, leads)
- Replenishment: page metrics, status i18n
- Allocations: status i18n, confirm toast
- Transfers detail: status i18n
- Leads list: description + header placement

### Store
- Account order status i18n
- Order confirmation BentoDetailHero

### Distributor
- Withdrawals BentoListHeader at page level

### Admin
- Replenishment, settlements, allocations table status i18n

### Docs
- `docs/design/design-system.md` — list/detail patterns, Toaster, status i18n rules

## Verification

- `rtk pnpm typecheck` — pass

## Next agent

User — browser smoke on merchant commissions, orders pickup verify, store confirmation.
