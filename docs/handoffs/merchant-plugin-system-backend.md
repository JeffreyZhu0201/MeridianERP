# Handoff: Merchant Plugin System — Backend

**Agent:** nestjs-backend  
**Date:** 2026-07-04  
**Branch:** feature/merchant-plugin-system

## Scope

- Prisma models PluginDefinition + TenantPlugin with migration
- PluginModule (PluginService, PluginGuard, CrmPluginGuard)
- Merchant plugins API (catalog, install/uninstall, installed-codes)
- Platform merchants plugins read API
- CRM controllers gated via CrmPluginGuard
- Default CRM install on merchant approve/create
- seed.ts plugin catalog + backfill
- mock-prisma plugin models
- merchant-plugins.e2e-spec.ts (6 tests)

## Files

- apps/api/prisma/schema.prisma
- apps/api/prisma/migrations/20260704100000_merchant_plugin_system/
- apps/api/src/plugins/*
- apps/api/src/merchant/plugins/*
- apps/api/src/platform/merchants/platform-merchants.controller.ts
- apps/api/src/platform/merchants/platform-merchants.service.ts
- apps/api/src/merchant/crm/**/*.controller.ts
- apps/api/test/merchant-plugins.e2e-spec.ts
- apps/api/test/helpers/mock-prisma.ts

## Next agent

nextjs-frontend
