# Handoff: Merchant Plugin System — Frontend

**Agent:** nextjs-frontend  
**Date:** 2026-07-04  
**Branch:** feature/merchant-plugin-system

## Scope

- MerchantShell nav filtering by installed plugins + stub plugin entries + marketplace link
- MerchantShellWrapper client fetch for installed-codes
- /plugins marketplace with install/uninstall
- Stub pages for HRM/IM/finance/OA/e-sign/customer service
- CRM layout redirect when CRM uninstalled
- Admin merchant detail plugins card
- i18n en/zh-CN for merchant.plugins and admin merchants.detail plugin keys

## Files

- packages/ui/src/components/shells/merchant-shell.tsx
- apps/merchant/components/merchant-shell-wrapper.tsx
- apps/merchant/lib/plugins.ts
- apps/merchant/app/plugins/**
- apps/merchant/app/hrm|im|finance-tax|oa|e-signature|customer-service/page.tsx
- apps/merchant/app/crm/layout.tsx
- apps/admin/app/merchants/[id]/**

## Next agent

test-engineer
