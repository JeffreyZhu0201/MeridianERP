# Diff Details

Date : 2026-07-10 15:39:05

Directory /Users/zhuzy2024/Documents/Workspace/MeridianERP

Total : 292 files,  14158 codes, 56 comments, 2027 blanks, all 16241 lines

[Summary](results.md) / [Details](details.md) / [Diff Summary](diff.md) / Diff Details

## Files
| filename | language | code | comment | blank | total |
| :--- | :--- | ---: | ---: | ---: | ---: |
| [.env.example](/.env.example) | DotENV | 39 | 22 | 10 | 71 |
| [.github/workflows/ci.yml](/.github/workflows/ci.yml) | YAML | 65 | 0 | 8 | 73 |
| [README.md](/README.md) | Markdown | 11 | 10 | -14 | 7 |
| [apps/admin/app/_components/admin-ai-insight-panel.tsx](/apps/admin/app/_components/admin-ai-insight-panel.tsx) | TypeScript JSX | 181 | 0 | 10 | 191 |
| [apps/admin/app/_components/admin-funds-ai-insight.tsx](/apps/admin/app/_components/admin-funds-ai-insight.tsx) | TypeScript JSX | 26 | 0 | 6 | 32 |
| [apps/admin/app/allocations/_components/allocations-view.tsx](/apps/admin/app/allocations/_components/allocations-view.tsx) | TypeScript JSX | -67 | 0 | -3 | -70 |
| [apps/admin/app/allocations/_components/master-sku-table.tsx](/apps/admin/app/allocations/_components/master-sku-table.tsx) | TypeScript JSX | 24 | 1 | 1 | 26 |
| [apps/admin/app/diagnosis/_components/diagnosis-panel.tsx](/apps/admin/app/diagnosis/_components/diagnosis-panel.tsx) | TypeScript JSX | 135 | 0 | 11 | 146 |
| [apps/admin/app/diagnosis/calls/_components/ai-calls-panel.tsx](/apps/admin/app/diagnosis/calls/_components/ai-calls-panel.tsx) | TypeScript JSX | 179 | 0 | 13 | 192 |
| [apps/admin/app/diagnosis/calls/page.tsx](/apps/admin/app/diagnosis/calls/page.tsx) | TypeScript JSX | 26 | 0 | 4 | 30 |
| [apps/admin/app/diagnosis/page.tsx](/apps/admin/app/diagnosis/page.tsx) | TypeScript JSX | 26 | 0 | 4 | 30 |
| [apps/admin/app/funds/_components/funds-overview.tsx](/apps/admin/app/funds/_components/funds-overview.tsx) | TypeScript JSX | 6 | 0 | -6 | 0 |
| [apps/admin/app/funds/commissions/page.tsx](/apps/admin/app/funds/commissions/page.tsx) | TypeScript JSX | 7 | 0 | 0 | 7 |
| [apps/admin/app/funds/expected-profit/page.tsx](/apps/admin/app/funds/expected-profit/page.tsx) | TypeScript JSX | 2 | 0 | 0 | 2 |
| [apps/admin/app/funds/inventory-cost/page.tsx](/apps/admin/app/funds/inventory-cost/page.tsx) | TypeScript JSX | 2 | 0 | 0 | 2 |
| [apps/admin/app/funds/net-profit/page.tsx](/apps/admin/app/funds/net-profit/page.tsx) | TypeScript JSX | 11 | 0 | -4 | 7 |
| [apps/admin/app/funds/page.tsx](/apps/admin/app/funds/page.tsx) | TypeScript JSX | 3 | 0 | -3 | 0 |
| [apps/admin/app/funds/procurement/page.tsx](/apps/admin/app/funds/procurement/page.tsx) | TypeScript JSX | 7 | 0 | 0 | 7 |
| [apps/admin/app/inventory/master-catalog/[id]/_components/master-sku-editor.tsx](/apps/admin/app/inventory/master-catalog/%5Bid%5D/_components/master-sku-editor.tsx) | TypeScript JSX | 222 | 1 | 17 | 240 |
| [apps/admin/app/inventory/master-catalog/[id]/page.tsx](/apps/admin/app/inventory/master-catalog/%5Bid%5D/page.tsx) | TypeScript JSX | 26 | 0 | 8 | 34 |
| [apps/admin/app/inventory/master-catalog/page.tsx](/apps/admin/app/inventory/master-catalog/page.tsx) | TypeScript JSX | 7 | 0 | -7 | 0 |
| [apps/admin/app/inventory/page.tsx](/apps/admin/app/inventory/page.tsx) | TypeScript JSX | 6 | 0 | 0 | 6 |
| [apps/admin/app/orders/_components/orders-view.tsx](/apps/admin/app/orders/_components/orders-view.tsx) | TypeScript JSX | 35 | 0 | 1 | 36 |
| [apps/admin/app/withdrawals/_components/withdrawals-table.tsx](/apps/admin/app/withdrawals/_components/withdrawals-table.tsx) | TypeScript JSX | 13 | 0 | 0 | 13 |
| [apps/admin/components/admin-list-page.tsx](/apps/admin/components/admin-list-page.tsx) | TypeScript JSX | -1 | -1 | -1 | -3 |
| [apps/admin/lib/ai-stream.ts](/apps/admin/lib/ai-stream.ts) | TypeScript | 11 | 0 | 3 | 14 |
| [apps/admin/lib/api.ts](/apps/admin/lib/api.ts) | TypeScript | 24 | 0 | 5 | 29 |
| [apps/admin/package.json](/apps/admin/package.json) | JSON | 1 | 0 | 0 | 1 |
| [apps/admin/tailwind.config.ts](/apps/admin/tailwind.config.ts) | TypeScript | 1 | 0 | 0 | 1 |
| [apps/api/eslint.config.mjs](/apps/api/eslint.config.mjs) | JavaScript | 18 | 0 | 0 | 18 |
| [apps/api/package.json](/apps/api/package.json) | JSON | 1 | 0 | 0 | 1 |
| [apps/api/prisma/migrations/20260706100000_customer_delivery_addresses/migration.sql](/apps/api/prisma/migrations/20260706100000_customer_delivery_addresses/migration.sql) | MS SQL | 18 | 3 | 4 | 25 |
| [apps/api/prisma/migrations/20260706120000_withdrawal_mock_payout_and_legacy_cleanup/migration.sql](/apps/api/prisma/migrations/20260706120000_withdrawal_mock_payout_and_legacy_cleanup/migration.sql) | MS SQL | 10 | 2 | 2 | 14 |
| [apps/api/prisma/migrations/20260707120000_master_sku_media_content/migration.sql](/apps/api/prisma/migrations/20260707120000_master_sku_media_content/migration.sql) | MS SQL | 44 | 1 | 14 | 59 |
| [apps/api/prisma/migrations/20260709100000_ai_call_logging/migration.sql](/apps/api/prisma/migrations/20260709100000_ai_call_logging/migration.sql) | MS SQL | 37 | 13 | 15 | 65 |
| [apps/api/prisma/schema.prisma](/apps/api/prisma/schema.prisma) | Prisma | 60 | -2 | 7 | 65 |
| [apps/api/prisma/seed.ts](/apps/api/prisma/seed.ts) | TypeScript | 259 | 0 | 26 | 285 |
| [apps/api/src/ai/ai.module.ts](/apps/api/src/ai/ai.module.ts) | TypeScript | 63 | 0 | 2 | 65 |
| [apps/api/src/ai/diagnosis/diagnosis.controller.ts](/apps/api/src/ai/diagnosis/diagnosis.controller.ts) | TypeScript | 33 | 0 | 4 | 37 |
| [apps/api/src/ai/diagnosis/diagnosis.service.ts](/apps/api/src/ai/diagnosis/diagnosis.service.ts) | TypeScript | 165 | 0 | 25 | 190 |
| [apps/api/src/ai/diagnosis/prompts/diagnosis-system-prompt.ts](/apps/api/src/ai/diagnosis/prompts/diagnosis-system-prompt.ts) | TypeScript | 10 | 0 | 4 | 14 |
| [apps/api/src/ai/diagnosis/tools/base.tool.ts](/apps/api/src/ai/diagnosis/tools/base.tool.ts) | TypeScript | 18 | 0 | 5 | 23 |
| [apps/api/src/ai/diagnosis/tools/commission.tool.ts](/apps/api/src/ai/diagnosis/tools/commission.tool.ts) | TypeScript | 161 | 0 | 10 | 171 |
| [apps/api/src/ai/diagnosis/tools/fund.tool.ts](/apps/api/src/ai/diagnosis/tools/fund.tool.ts) | TypeScript | 109 | 0 | 10 | 119 |
| [apps/api/src/ai/diagnosis/tools/inventory.tool.ts](/apps/api/src/ai/diagnosis/tools/inventory.tool.ts) | TypeScript | 71 | 0 | 9 | 80 |
| [apps/api/src/ai/diagnosis/tools/order.tool.ts](/apps/api/src/ai/diagnosis/tools/order.tool.ts) | TypeScript | 64 | 0 | 8 | 72 |
| [apps/api/src/ai/insights/delivery-order-insight.service.ts](/apps/api/src/ai/insights/delivery-order-insight.service.ts) | TypeScript | 79 | 0 | 9 | 88 |
| [apps/api/src/ai/insights/funds-insight.service.ts](/apps/api/src/ai/insights/funds-insight.service.ts) | TypeScript | 123 | 0 | 10 | 133 |
| [apps/api/src/ai/insights/platform-ai-insights.controller.ts](/apps/api/src/ai/insights/platform-ai-insights.controller.ts) | TypeScript | 65 | 0 | 8 | 73 |
| [apps/api/src/ai/insights/prompts/admin-insight-system-prompt.ts](/apps/api/src/ai/insights/prompts/admin-insight-system-prompt.ts) | TypeScript | 13 | 0 | 3 | 16 |
| [apps/api/src/ai/insights/withdrawal-insight.service.ts](/apps/api/src/ai/insights/withdrawal-insight.service.ts) | TypeScript | 82 | 0 | 10 | 92 |
| [apps/api/src/ai/llm/admin-insight-mock.client.ts](/apps/api/src/ai/llm/admin-insight-mock.client.ts) | TypeScript | 127 | 0 | 12 | 139 |
| [apps/api/src/ai/llm/admin-insight.types.ts](/apps/api/src/ai/llm/admin-insight.types.ts) | TypeScript | 5 | 0 | 2 | 7 |
| [apps/api/src/ai/llm/ai-llm-stream.service.ts](/apps/api/src/ai/llm/ai-llm-stream.service.ts) | TypeScript | 94 | 0 | 9 | 103 |
| [apps/api/src/ai/llm/ai-llm.service.ts](/apps/api/src/ai/llm/ai-llm.service.ts) | TypeScript | 573 | 0 | 53 | 626 |
| [apps/api/src/ai/llm/anthropic-llm.client.ts](/apps/api/src/ai/llm/anthropic-llm.client.ts) | TypeScript | 155 | 0 | 20 | 175 |
| [apps/api/src/ai/llm/crm-follow-up-mock.client.ts](/apps/api/src/ai/llm/crm-follow-up-mock.client.ts) | TypeScript | 113 | 0 | 8 | 121 |
| [apps/api/src/ai/llm/crm-follow-up.types.ts](/apps/api/src/ai/llm/crm-follow-up.types.ts) | TypeScript | 27 | 0 | 5 | 32 |
| [apps/api/src/ai/llm/diagnosis-result.builder.ts](/apps/api/src/ai/llm/diagnosis-result.builder.ts) | TypeScript | 79 | 0 | 10 | 89 |
| [apps/api/src/ai/llm/llm-client.interface.ts](/apps/api/src/ai/llm/llm-client.interface.ts) | TypeScript | 8 | 0 | 2 | 10 |
| [apps/api/src/ai/llm/merchant-ai.types.ts](/apps/api/src/ai/llm/merchant-ai.types.ts) | TypeScript | 41 | 0 | 3 | 44 |
| [apps/api/src/ai/llm/mock-llm.client.ts](/apps/api/src/ai/llm/mock-llm.client.ts) | TypeScript | 21 | 0 | 2 | 23 |
| [apps/api/src/ai/llm/product-copy-mock.client.ts](/apps/api/src/ai/llm/product-copy-mock.client.ts) | TypeScript | 91 | 0 | 12 | 103 |
| [apps/api/src/ai/llm/replenishment-mock.client.ts](/apps/api/src/ai/llm/replenishment-mock.client.ts) | TypeScript | 92 | 0 | 13 | 105 |
| [apps/api/src/ai/llm/tool-run-result.ts](/apps/api/src/ai/llm/tool-run-result.ts) | TypeScript | 7 | 0 | 2 | 9 |
| [apps/api/src/ai/logging/ai-analysis-record.service.ts](/apps/api/src/ai/logging/ai-analysis-record.service.ts) | TypeScript | 104 | 0 | 13 | 117 |
| [apps/api/src/ai/logging/ai-call-log.service.ts](/apps/api/src/ai/logging/ai-call-log.service.ts) | TypeScript | 113 | 0 | 8 | 121 |
| [apps/api/src/ai/logging/ai-invocation.types.ts](/apps/api/src/ai/logging/ai-invocation.types.ts) | TypeScript | 34 | 0 | 6 | 40 |
| [apps/api/src/ai/logging/platform-ai-calls.controller.ts](/apps/api/src/ai/logging/platform-ai-calls.controller.ts) | TypeScript | 35 | 0 | 4 | 39 |
| [apps/api/src/ai/streaming/ai-sse.helper.ts](/apps/api/src/ai/streaming/ai-sse.helper.ts) | TypeScript | 35 | 0 | 6 | 41 |
| [apps/api/src/ai/streaming/ai-stream-emitters.ts](/apps/api/src/ai/streaming/ai-stream-emitters.ts) | TypeScript | 29 | 0 | 4 | 33 |
| [apps/api/src/ai/streaming/ai-stream-result-emitters.ts](/apps/api/src/ai/streaming/ai-stream-result-emitters.ts) | TypeScript | 72 | 0 | 6 | 78 |
| [apps/api/src/app.module.ts](/apps/api/src/app.module.ts) | TypeScript | 4 | 0 | 0 | 4 |
| [apps/api/src/auth/auth.module.ts](/apps/api/src/auth/auth.module.ts) | TypeScript | 1 | 0 | 0 | 1 |
| [apps/api/src/auth/guards/merchant-owner.guard.ts](/apps/api/src/auth/guards/merchant-owner.guard.ts) | TypeScript | 2 | 0 | 0 | 2 |
| [apps/api/src/auth/guards/platform-roles.guard.ts](/apps/api/src/auth/guards/platform-roles.guard.ts) | TypeScript | 2 | 0 | 0 | 2 |
| [apps/api/src/auth/jwt-sign-options.ts](/apps/api/src/auth/jwt-sign-options.ts) | TypeScript | 18 | 0 | 6 | 24 |
| [apps/api/src/commission/commission.service.ts](/apps/api/src/commission/commission.service.ts) | TypeScript | 2 | 0 | 0 | 2 |
| [apps/api/src/distributor/auth/distributor-auth.service.ts](/apps/api/src/distributor/auth/distributor-auth.service.ts) | TypeScript | 1 | 0 | 0 | 1 |
| [apps/api/src/distributor/distributor-me.service.ts](/apps/api/src/distributor/distributor-me.service.ts) | TypeScript | 4 | 0 | 0 | 4 |
| [apps/api/src/fulfillment/fulfillment.service.ts](/apps/api/src/fulfillment/fulfillment.service.ts) | TypeScript | 2 | 0 | 0 | 2 |
| [apps/api/src/media/local-storage.provider.ts](/apps/api/src/media/local-storage.provider.ts) | TypeScript | 34 | 0 | 7 | 41 |
| [apps/api/src/media/media-validation.ts](/apps/api/src/media/media-validation.ts) | TypeScript | 41 | 0 | 5 | 46 |
| [apps/api/src/media/media.module.ts](/apps/api/src/media/media.module.ts) | TypeScript | 17 | 0 | 2 | 19 |
| [apps/api/src/media/media.service.ts](/apps/api/src/media/media.service.ts) | TypeScript | 100 | 0 | 13 | 113 |
| [apps/api/src/media/platform-media.controller.ts](/apps/api/src/media/platform-media.controller.ts) | TypeScript | 66 | 0 | 5 | 71 |
| [apps/api/src/media/s3-storage.provider.ts](/apps/api/src/media/s3-storage.provider.ts) | TypeScript | 56 | 0 | 7 | 63 |
| [apps/api/src/media/storage-provider.interface.ts](/apps/api/src/media/storage-provider.interface.ts) | TypeScript | 10 | 0 | 2 | 12 |
| [apps/api/src/media/uploaded-image-file.ts](/apps/api/src/media/uploaded-image-file.ts) | TypeScript | 6 | 0 | 1 | 7 |
| [apps/api/src/merchant/auth/merchant-auth.controller.ts](/apps/api/src/merchant/auth/merchant-auth.controller.ts) | TypeScript | 7 | 0 | 0 | 7 |
| [apps/api/src/merchant/catalog/ai/catalog-ai.controller.ts](/apps/api/src/merchant/catalog/ai/catalog-ai.controller.ts) | TypeScript | 32 | 0 | 4 | 36 |
| [apps/api/src/merchant/catalog/ai/product-copy-ai.service.ts](/apps/api/src/merchant/catalog/ai/product-copy-ai.service.ts) | TypeScript | 126 | 0 | 15 | 141 |
| [apps/api/src/merchant/catalog/ai/prompts/product-copy-system-prompt.ts](/apps/api/src/merchant/catalog/ai/prompts/product-copy-system-prompt.ts) | TypeScript | 12 | 0 | 4 | 16 |
| [apps/api/src/merchant/catalog/categories.service.ts](/apps/api/src/merchant/catalog/categories.service.ts) | TypeScript | -5 | 0 | 0 | -5 |
| [apps/api/src/merchant/crm/ai/crm-ai.controller.ts](/apps/api/src/merchant/crm/ai/crm-ai.controller.ts) | TypeScript | 35 | 0 | 4 | 39 |
| [apps/api/src/merchant/crm/ai/crm-follow-up.service.ts](/apps/api/src/merchant/crm/ai/crm-follow-up.service.ts) | TypeScript | 182 | 0 | 20 | 202 |
| [apps/api/src/merchant/crm/ai/prompts/crm-follow-up-system-prompt.ts](/apps/api/src/merchant/crm/ai/prompts/crm-follow-up-system-prompt.ts) | TypeScript | 17 | 0 | 5 | 22 |
| [apps/api/src/merchant/inventory/ai/inventory-ai.controller.ts](/apps/api/src/merchant/inventory/ai/inventory-ai.controller.ts) | TypeScript | 82 | 0 | 7 | 89 |
| [apps/api/src/merchant/inventory/ai/prompts/replenishment-system-prompt.ts](/apps/api/src/merchant/inventory/ai/prompts/replenishment-system-prompt.ts) | TypeScript | 25 | 0 | 5 | 30 |
| [apps/api/src/merchant/inventory/ai/replenishment-ai.service.ts](/apps/api/src/merchant/inventory/ai/replenishment-ai.service.ts) | TypeScript | 287 | 0 | 34 | 321 |
| [apps/api/src/merchant/inventory/merchant-inventory.module.ts](/apps/api/src/merchant/inventory/merchant-inventory.module.ts) | TypeScript | 6 | 0 | 0 | 6 |
| [apps/api/src/merchant/inventory/merchant-purchase-orders.service.ts](/apps/api/src/merchant/inventory/merchant-purchase-orders.service.ts) | TypeScript | 1 | 0 | 0 | 1 |
| [apps/api/src/merchant/inventory/merchant-stock.service.ts](/apps/api/src/merchant/inventory/merchant-stock.service.ts) | TypeScript | 2 | 0 | 0 | 2 |
| [apps/api/src/merchant/merchant.module.ts](/apps/api/src/merchant/merchant.module.ts) | TypeScript | 10 | 0 | 0 | 10 |
| [apps/api/src/merchant/procurement/merchant-procurement.service.ts](/apps/api/src/merchant/procurement/merchant-procurement.service.ts) | TypeScript | 5 | 0 | 0 | 5 |
| [apps/api/src/merchant/settings/merchant-procurement-addresses.service.ts](/apps/api/src/merchant/settings/merchant-procurement-addresses.service.ts) | TypeScript | 4 | 0 | 0 | 4 |
| [apps/api/src/orders/order-lifecycle.service.ts](/apps/api/src/orders/order-lifecycle.service.ts) | TypeScript | 18 | 0 | 0 | 18 |
| [apps/api/src/payout/index.ts](/apps/api/src/payout/index.ts) | TypeScript | 2 | 0 | 1 | 3 |
| [apps/api/src/payout/payout.module.ts](/apps/api/src/payout/payout.module.ts) | TypeScript | 9 | 0 | 2 | 11 |
| [apps/api/src/payout/payout.service.ts](/apps/api/src/payout/payout.service.ts) | TypeScript | 36 | 0 | 8 | 44 |
| [apps/api/src/platform/accounts/platform-accounts.service.ts](/apps/api/src/platform/accounts/platform-accounts.service.ts) | TypeScript | 10 | 0 | 1 | 11 |
| [apps/api/src/platform/allocations/platform-allocations.controller.ts](/apps/api/src/platform/allocations/platform-allocations.controller.ts) | TypeScript | -12 | 0 | 1 | -11 |
| [apps/api/src/platform/allocations/platform-allocations.module.ts](/apps/api/src/platform/allocations/platform-allocations.module.ts) | TypeScript | 2 | 0 | 0 | 2 |
| [apps/api/src/platform/allocations/platform-allocations.service.ts](/apps/api/src/platform/allocations/platform-allocations.service.ts) | TypeScript | 58 | 0 | 5 | 63 |
| [apps/api/src/platform/auth/platform-auth.service.ts](/apps/api/src/platform/auth/platform-auth.service.ts) | TypeScript | -2 | 0 | 0 | -2 |
| [apps/api/src/platform/catalog/product-content.util.ts](/apps/api/src/platform/catalog/product-content.util.ts) | TypeScript | 111 | 0 | 16 | 127 |
| [apps/api/src/platform/dashboard/platform-dashboard.service.ts](/apps/api/src/platform/dashboard/platform-dashboard.service.ts) | TypeScript | 2 | 0 | 0 | 2 |
| [apps/api/src/platform/flagship-catalog/flagship-catalog.service.ts](/apps/api/src/platform/flagship-catalog/flagship-catalog.service.ts) | TypeScript | 42 | 0 | 2 | 44 |
| [apps/api/src/platform/funds/platform-funds.service.ts](/apps/api/src/platform/funds/platform-funds.service.ts) | TypeScript | 10 | 0 | 0 | 10 |
| [apps/api/src/platform/merchants/platform-merchants.controller.ts](/apps/api/src/platform/merchants/platform-merchants.controller.ts) | TypeScript | -3 | 0 | 0 | -3 |
| [apps/api/src/platform/merchants/platform-merchants.service.ts](/apps/api/src/platform/merchants/platform-merchants.service.ts) | TypeScript | -4 | 0 | 0 | -4 |
| [apps/api/src/platform/procurement/platform-procurement.service.ts](/apps/api/src/platform/procurement/platform-procurement.service.ts) | TypeScript | 9 | 0 | 0 | 9 |
| [apps/api/src/platform/users/platform-users.service.ts](/apps/api/src/platform/users/platform-users.service.ts) | TypeScript | -1 | 0 | 0 | -1 |
| [apps/api/src/platform/withdrawals/platform-withdrawals.controller.ts](/apps/api/src/platform/withdrawals/platform-withdrawals.controller.ts) | TypeScript | 3 | 0 | 0 | 3 |
| [apps/api/src/platform/withdrawals/platform-withdrawals.module.ts](/apps/api/src/platform/withdrawals/platform-withdrawals.module.ts) | TypeScript | 1 | 0 | 0 | 1 |
| [apps/api/src/platform/withdrawals/platform-withdrawals.service.ts](/apps/api/src/platform/withdrawals/platform-withdrawals.service.ts) | TypeScript | 21 | 0 | 1 | 22 |
| [apps/api/src/plugins/crm-plugin.guard.ts](/apps/api/src/plugins/crm-plugin.guard.ts) | TypeScript | 2 | 0 | 0 | 2 |
| [apps/api/src/plugins/plugin.guard.ts](/apps/api/src/plugins/plugin.guard.ts) | TypeScript | 2 | 0 | 0 | 2 |
| [apps/api/src/plugins/plugin.service.ts](/apps/api/src/plugins/plugin.service.ts) | TypeScript | -3 | 0 | 0 | -3 |
| [apps/api/src/queue/inventory-queue.service.ts](/apps/api/src/queue/inventory-queue.service.ts) | TypeScript | 1 | 0 | 0 | 1 |
| [apps/api/src/queue/order.processor.ts](/apps/api/src/queue/order.processor.ts) | TypeScript | -1 | 0 | 0 | -1 |
| [apps/api/src/store/account/dto/store-account.dto.ts](/apps/api/src/store/account/dto/store-account.dto.ts) | TypeScript | 74 | 0 | 24 | 98 |
| [apps/api/src/store/account/store-account-addresses.service.ts](/apps/api/src/store/account/store-account-addresses.service.ts) | TypeScript | 164 | 0 | 14 | 178 |
| [apps/api/src/store/account/store-account.controller.ts](/apps/api/src/store/account/store-account.controller.ts) | TypeScript | 69 | 0 | 8 | 77 |
| [apps/api/src/store/auth/dto/store-auth.dto.ts](/apps/api/src/store/auth/dto/store-auth.dto.ts) | TypeScript | 0 | 0 | -1 | -1 |
| [apps/api/src/store/auth/store-auth.service.ts](/apps/api/src/store/auth/store-auth.service.ts) | TypeScript | 72 | 0 | 11 | 83 |
| [apps/api/src/store/catalog/store-catalog.service.ts](/apps/api/src/store/catalog/store-catalog.service.ts) | TypeScript | 30 | 0 | 1 | 31 |
| [apps/api/src/store/checkout/store-checkout.service.ts](/apps/api/src/store/checkout/store-checkout.service.ts) | TypeScript | -1 | 0 | 0 | -1 |
| [apps/api/src/store/orders/store-orders.service.ts](/apps/api/src/store/orders/store-orders.service.ts) | TypeScript | 1 | 0 | 0 | 1 |
| [apps/api/src/store/store.module.ts](/apps/api/src/store/store.module.ts) | TypeScript | 4 | 0 | 0 | 4 |
| [apps/api/src/store/stores/store-stores.service.ts](/apps/api/src/store/stores/store-stores.service.ts) | TypeScript | -4 | 0 | 0 | -4 |
| [apps/api/test/ai-stream-mock.e2e-spec.ts](/apps/api/test/ai-stream-mock.e2e-spec.ts) | TypeScript | 98 | 0 | 13 | 111 |
| [apps/api/test/allocation-confirm-content.e2e-spec.ts](/apps/api/test/allocation-confirm-content.e2e-spec.ts) | TypeScript | 191 | 0 | 22 | 213 |
| [apps/api/test/branch-procurement.e2e-spec.ts](/apps/api/test/branch-procurement.e2e-spec.ts) | TypeScript | 5 | 0 | 0 | 5 |
| [apps/api/test/crm-store-customers.e2e-spec.ts](/apps/api/test/crm-store-customers.e2e-spec.ts) | TypeScript | 20 | 0 | 0 | 20 |
| [apps/api/test/flagship-catalog-sync-content.e2e-spec.ts](/apps/api/test/flagship-catalog-sync-content.e2e-spec.ts) | TypeScript | 78 | 0 | 9 | 87 |
| [apps/api/test/gaps-wave1.e2e-spec.ts](/apps/api/test/gaps-wave1.e2e-spec.ts) | TypeScript | 9 | 0 | 2 | 11 |
| [apps/api/test/helpers/mock-prisma.ts](/apps/api/test/helpers/mock-prisma.ts) | TypeScript | 603 | 0 | 5 | 608 |
| [apps/api/test/helpers/test-media.ts](/apps/api/test/helpers/test-media.ts) | TypeScript | 41 | 1 | 5 | 47 |
| [apps/api/test/merchant-catalog-ai-product-copy.e2e-spec.ts](/apps/api/test/merchant-catalog-ai-product-copy.e2e-spec.ts) | TypeScript | 102 | 0 | 15 | 117 |
| [apps/api/test/merchant-crm-ai-follow-up.e2e-spec.ts](/apps/api/test/merchant-crm-ai-follow-up.e2e-spec.ts) | TypeScript | 113 | 0 | 14 | 127 |
| [apps/api/test/merchant-inventory-ai-replenishment.e2e-spec.ts](/apps/api/test/merchant-inventory-ai-replenishment.e2e-spec.ts) | TypeScript | 156 | 0 | 25 | 181 |
| [apps/api/test/merchant-orders-delivery.e2e-spec.ts](/apps/api/test/merchant-orders-delivery.e2e-spec.ts) | TypeScript | -2 | 0 | 0 | -2 |
| [apps/api/test/merchant-plugins.e2e-spec.ts](/apps/api/test/merchant-plugins.e2e-spec.ts) | TypeScript | 4 | 0 | 0 | 4 |
| [apps/api/test/merchant-procurement-ai-prefill.e2e-spec.ts](/apps/api/test/merchant-procurement-ai-prefill.e2e-spec.ts) | TypeScript | 110 | 0 | 15 | 125 |
| [apps/api/test/platform-admin-ai-insights.e2e-spec.ts](/apps/api/test/platform-admin-ai-insights.e2e-spec.ts) | TypeScript | 161 | 0 | 14 | 175 |
| [apps/api/test/platform-ai-calls.e2e-spec.ts](/apps/api/test/platform-ai-calls.e2e-spec.ts) | TypeScript | 94 | 0 | 16 | 110 |
| [apps/api/test/platform-ai-diagnosis.e2e-spec.ts](/apps/api/test/platform-ai-diagnosis.e2e-spec.ts) | TypeScript | 78 | 0 | 12 | 90 |
| [apps/api/test/platform-master-sku-content.e2e-spec.ts](/apps/api/test/platform-master-sku-content.e2e-spec.ts) | TypeScript | 81 | 0 | 9 | 90 |
| [apps/api/test/platform-media-upload.e2e-spec.ts](/apps/api/test/platform-media-upload.e2e-spec.ts) | TypeScript | 103 | 0 | 15 | 118 |
| [apps/api/test/platform-orders.e2e-spec.ts](/apps/api/test/platform-orders.e2e-spec.ts) | TypeScript | -3 | 0 | 0 | -3 |
| [apps/api/test/platform-withdrawals.e2e-spec.ts](/apps/api/test/platform-withdrawals.e2e-spec.ts) | TypeScript | 3 | 0 | 0 | 3 |
| [apps/api/test/setup-e2e.ts](/apps/api/test/setup-e2e.ts) | TypeScript | 3 | 0 | 0 | 3 |
| [apps/api/test/setup.ts](/apps/api/test/setup.ts) | TypeScript | 2 | 0 | 0 | 2 |
| [apps/api/test/store-account.e2e-spec.ts](/apps/api/test/store-account.e2e-spec.ts) | TypeScript | 128 | 0 | 29 | 157 |
| [apps/api/test/store-catalog-images.e2e-spec.ts](/apps/api/test/store-catalog-images.e2e-spec.ts) | TypeScript | 90 | 0 | 12 | 102 |
| [apps/api/test/store-order-lifecycle.e2e-spec.ts](/apps/api/test/store-order-lifecycle.e2e-spec.ts) | TypeScript | 10 | 0 | 0 | 10 |
| [apps/api/test/store-stores.e2e-spec.ts](/apps/api/test/store-stores.e2e-spec.ts) | TypeScript | 10 | 0 | 0 | 10 |
| [apps/distributor/Dockerfile](/apps/distributor/Dockerfile) | Docker | 32 | 1 | 5 | 38 |
| [apps/distributor/app/(portal)/branches/page.tsx](/apps/distributor/app/(portal)/branches/page.tsx) | TypeScript JSX | 89 | 0 | 6 | 95 |
| [apps/distributor/app/(portal)/commissions/page.tsx](/apps/distributor/app/(portal)/commissions/page.tsx) | TypeScript JSX | 158 | 0 | 12 | 170 |
| [apps/distributor/app/(portal)/layout.tsx](/apps/distributor/app/(portal)/layout.tsx) | TypeScript JSX | 4 | 0 | 2 | 6 |
| [apps/distributor/app/(portal)/page.tsx](/apps/distributor/app/(portal)/page.tsx) | TypeScript JSX | 81 | 0 | 6 | 87 |
| [apps/distributor/app/(portal)/share/_components/share-panel.tsx](/apps/distributor/app/(portal)/share/_components/share-panel.tsx) | TypeScript JSX | 158 | 0 | 11 | 169 |
| [apps/distributor/app/(portal)/share/page.tsx](/apps/distributor/app/(portal)/share/page.tsx) | TypeScript JSX | 26 | 0 | 5 | 31 |
| [apps/distributor/app/(portal)/withdrawals/_components/withdrawals-panel.tsx](/apps/distributor/app/(portal)/withdrawals/_components/withdrawals-panel.tsx) | TypeScript JSX | 159 | 0 | 11 | 170 |
| [apps/distributor/app/(portal)/withdrawals/page.tsx](/apps/distributor/app/(portal)/withdrawals/page.tsx) | TypeScript JSX | 37 | 0 | 6 | 43 |
| [apps/distributor/app/branches/page.tsx](/apps/distributor/app/branches/page.tsx) | TypeScript JSX | -89 | 0 | -6 | -95 |
| [apps/distributor/app/commissions/page.tsx](/apps/distributor/app/commissions/page.tsx) | TypeScript JSX | -158 | 0 | -12 | -170 |
| [apps/distributor/app/layout.tsx](/apps/distributor/app/layout.tsx) | TypeScript JSX | -3 | 0 | -1 | -4 |
| [apps/distributor/app/login/_components/login-form.tsx](/apps/distributor/app/login/_components/login-form.tsx) | TypeScript JSX | 105 | 0 | 11 | 116 |
| [apps/distributor/app/login/page.tsx](/apps/distributor/app/login/page.tsx) | TypeScript JSX | -79 | 0 | -6 | -85 |
| [apps/distributor/app/page.tsx](/apps/distributor/app/page.tsx) | TypeScript JSX | -81 | 0 | -6 | -87 |
| [apps/distributor/app/share/_components/share-panel.tsx](/apps/distributor/app/share/_components/share-panel.tsx) | TypeScript JSX | -158 | 0 | -11 | -169 |
| [apps/distributor/app/share/page.tsx](/apps/distributor/app/share/page.tsx) | TypeScript JSX | -26 | 0 | -5 | -31 |
| [apps/distributor/app/withdrawals/_components/withdrawals-panel.tsx](/apps/distributor/app/withdrawals/_components/withdrawals-panel.tsx) | TypeScript JSX | -155 | 0 | -11 | -166 |
| [apps/distributor/app/withdrawals/page.tsx](/apps/distributor/app/withdrawals/page.tsx) | TypeScript JSX | -37 | 0 | -6 | -43 |
| [apps/distributor/lib/api.ts](/apps/distributor/lib/api.ts) | TypeScript | -1 | 0 | 0 | -1 |
| [apps/landing/Dockerfile](/apps/landing/Dockerfile) | Docker | 26 | 1 | 5 | 32 |
| [apps/merchant/app/catalog/products/_components/product-copy-ai-panel.tsx](/apps/merchant/app/catalog/products/_components/product-copy-ai-panel.tsx) | TypeScript JSX | 207 | 0 | 12 | 219 |
| [apps/merchant/app/catalog/products/_components/products-table.tsx](/apps/merchant/app/catalog/products/_components/products-table.tsx) | TypeScript JSX | 10 | 0 | 0 | 10 |
| [apps/merchant/app/crm/_components/crm-ai-follow-up-panel.tsx](/apps/merchant/app/crm/_components/crm-ai-follow-up-panel.tsx) | TypeScript JSX | 158 | 0 | 12 | 170 |
| [apps/merchant/app/crm/contacts/[id]/_components/contact-detail.tsx](/apps/merchant/app/crm/contacts/%5Bid%5D/_components/contact-detail.tsx) | TypeScript JSX | 2 | 0 | 1 | 3 |
| [apps/merchant/app/crm/leads/[id]/_components/lead-detail.tsx](/apps/merchant/app/crm/leads/%5Bid%5D/_components/lead-detail.tsx) | TypeScript JSX | 2 | 0 | 1 | 3 |
| [apps/merchant/app/funds/_components/merchant-funds-panel.tsx](/apps/merchant/app/funds/_components/merchant-funds-panel.tsx) | TypeScript JSX | 4 | 0 | -4 | 0 |
| [apps/merchant/app/funds/page.tsx](/apps/merchant/app/funds/page.tsx) | TypeScript JSX | 3 | 0 | -3 | 0 |
| [apps/merchant/app/inventory/alerts/_components/inventory-ai-replenishment-panel.tsx](/apps/merchant/app/inventory/alerts/_components/inventory-ai-replenishment-panel.tsx) | TypeScript JSX | 325 | 0 | 24 | 349 |
| [apps/merchant/app/inventory/alerts/page.tsx](/apps/merchant/app/inventory/alerts/page.tsx) | TypeScript JSX | 2 | 0 | 0 | 2 |
| [apps/merchant/app/inventory/procurement/_components/procurement-shop.tsx](/apps/merchant/app/inventory/procurement/_components/procurement-shop.tsx) | TypeScript JSX | 87 | 0 | 2 | 89 |
| [apps/merchant/app/orders/page.tsx](/apps/merchant/app/orders/page.tsx) | TypeScript JSX | 1 | 0 | 0 | 1 |
| [apps/merchant/lib/ai-stream.ts](/apps/merchant/lib/ai-stream.ts) | TypeScript | 11 | 0 | 3 | 14 |
| [apps/store/app/shop/_components/checkout/checkout-form.tsx](/apps/store/app/shop/_components/checkout/checkout-form.tsx) | TypeScript JSX | 29 | 0 | 1 | 30 |
| [apps/store/app/shop/_components/unified-product-detail.tsx](/apps/store/app/shop/_components/unified-product-detail.tsx) | TypeScript JSX | 49 | 2 | 2 | 53 |
| [apps/store/app/shop/_components/unified-product-grid.tsx](/apps/store/app/shop/_components/unified-product-grid.tsx) | TypeScript JSX | 1 | 0 | 0 | 1 |
| [apps/store/app/shop/account/_components/account-layout.tsx](/apps/store/app/shop/account/_components/account-layout.tsx) | TypeScript JSX | 29 | 0 | 3 | 32 |
| [apps/store/app/shop/account/_components/addresses-panel.tsx](/apps/store/app/shop/account/_components/addresses-panel.tsx) | TypeScript JSX | 135 | 0 | 9 | 144 |
| [apps/store/app/shop/account/_components/settings-panel.tsx](/apps/store/app/shop/account/_components/settings-panel.tsx) | TypeScript JSX | 60 | 0 | 5 | 65 |
| [apps/store/app/shop/account/addresses/page.tsx](/apps/store/app/shop/account/addresses/page.tsx) | TypeScript JSX | 37 | 0 | 9 | 46 |
| [apps/store/app/shop/account/page.tsx](/apps/store/app/shop/account/page.tsx) | TypeScript JSX | -13 | 0 | 0 | -13 |
| [apps/store/app/shop/account/settings/page.tsx](/apps/store/app/shop/account/settings/page.tsx) | TypeScript JSX | 38 | 0 | 9 | 47 |
| [apps/store/app/shop/orders/[id]/confirmation/page.tsx](/apps/store/app/shop/orders/%5Bid%5D/confirmation/page.tsx) | TypeScript JSX | 7 | 0 | -7 | 0 |
| [apps/store/app/shop/page.tsx](/apps/store/app/shop/page.tsx) | TypeScript JSX | 17 | 0 | 2 | 19 |
| [apps/store/components/branch-select.tsx](/apps/store/components/branch-select.tsx) | TypeScript JSX | 7 | 0 | 1 | 8 |
| [apps/store/lib/api.ts](/apps/store/lib/api.ts) | TypeScript | 8 | 0 | 0 | 8 |
| [apps/store/lib/fulfillment.ts](/apps/store/lib/fulfillment.ts) | TypeScript | 11 | 0 | 2 | 13 |
| [apps/store/package.json](/apps/store/package.json) | JSON | 1 | 0 | 0 | 1 |
| [apps/store/tailwind.config.ts](/apps/store/tailwind.config.ts) | TypeScript | 6 | 0 | 0 | 6 |
| [docker/docker-compose.yml](/docker/docker-compose.yml) | YAML | 24 | 0 | 2 | 26 |
| [docs/PRODUCT.md](/docs/PRODUCT.md) | Markdown | 9 | 0 | 0 | 9 |
| [docs/architecture/admin-ai-insights.md](/docs/architecture/admin-ai-insights.md) | Markdown | 25 | 0 | 9 | 34 |
| [docs/architecture/ai-diagnosis.md](/docs/architecture/ai-diagnosis.md) | Markdown | 57 | 0 | 26 | 83 |
| [docs/architecture/ai-streaming.md](/docs/architecture/ai-streaming.md) | Markdown | 49 | 0 | 20 | 69 |
| [docs/architecture/crm-ai-follow-up.md](/docs/architecture/crm-ai-follow-up.md) | Markdown | 41 | 0 | 15 | 56 |
| [docs/architecture/media-storage.md](/docs/architecture/media-storage.md) | Markdown | 34 | 0 | 18 | 52 |
| [docs/architecture/merchant-ai-efficiency.md](/docs/architecture/merchant-ai-efficiency.md) | Markdown | 38 | 0 | 15 | 53 |
| [docs/architecture/phase-4-distributor-enhancements.md](/docs/architecture/phase-4-distributor-enhancements.md) | Markdown | -572 | 0 | -218 | -790 |
| [docs/architecture/phase-4-distributor-slice3.md](/docs/architecture/phase-4-distributor-slice3.md) | Markdown | 1 | 0 | 1 | 2 |
| [docs/architecture/phase-4-distributor-slice4.md](/docs/architecture/phase-4-distributor-slice4.md) | Markdown | 1 | 0 | 1 | 2 |
| [docs/architecture/store-account.md](/docs/architecture/store-account.md) | Markdown | 54 | 0 | 18 | 72 |
| [docs/archive/phase-4-distributor-enhancements.md](/docs/archive/phase-4-distributor-enhancements.md) | Markdown | 578 | 0 | 224 | 802 |
| [docs/design/admin-ai-insights.md](/docs/design/admin-ai-insights.md) | Markdown | 12 | 0 | 8 | 20 |
| [docs/design/admin-master-sku-editor.md](/docs/design/admin-master-sku-editor.md) | Markdown | 25 | 0 | 14 | 39 |
| [docs/design/ai-diagnosis.md](/docs/design/ai-diagnosis.md) | Markdown | 24 | 0 | 11 | 35 |
| [docs/design/crm-ai-follow-up.md](/docs/design/crm-ai-follow-up.md) | Markdown | 20 | 0 | 12 | 32 |
| [docs/design/merchant-ai-efficiency.md](/docs/design/merchant-ai-efficiency.md) | Markdown | 19 | 0 | 13 | 32 |
| [docs/design/store.md](/docs/design/store.md) | Markdown | 9 | 0 | 2 | 11 |
| [docs/handoffs/admin-master-sku-content-implementation.md](/docs/handoffs/admin-master-sku-content-implementation.md) | Markdown | 25 | 0 | 11 | 36 |
| [docs/handoffs/flagship-catalog-store-github.md](/docs/handoffs/flagship-catalog-store-github.md) | Markdown | 18 | 0 | 6 | 24 |
| [docs/handoffs/flagship-catalog-store-implementation.md](/docs/handoffs/flagship-catalog-store-implementation.md) | Markdown | 20 | 0 | 10 | 30 |
| [docs/handoffs/store-account-implementation.md](/docs/handoffs/store-account-implementation.md) | Markdown | 21 | 0 | 10 | 31 |
| [docs/prd/admin-ai-insights.md](/docs/prd/admin-ai-insights.md) | Markdown | 31 | 0 | 17 | 48 |
| [docs/prd/admin-master-sku-content.md](/docs/prd/admin-master-sku-content.md) | Markdown | 29 | 0 | 17 | 46 |
| [docs/prd/crm-ai-follow-up.md](/docs/prd/crm-ai-follow-up.md) | Markdown | 33 | 0 | 19 | 52 |
| [docs/prd/merchant-ai-efficiency.md](/docs/prd/merchant-ai-efficiency.md) | Markdown | 51 | 0 | 26 | 77 |
| [docs/prd/phase-5-distribution-and-allocation.md](/docs/prd/phase-5-distribution-and-allocation.md) | Markdown | 1 | 0 | 1 | 2 |
| [docs/prd/store-account.md](/docs/prd/store-account.md) | Markdown | 32 | 0 | 23 | 55 |
| [docs/reports/功能报告.md](/docs/reports/%E5%8A%9F%E8%83%BD%E6%8A%A5%E5%91%8A.md) | Markdown | 1 | 0 | 1 | 2 |
| [docs/superpowers/plans/2026-07-07-merchant-ai-efficiency.md](/docs/superpowers/plans/2026-07-07-merchant-ai-efficiency.md) | Markdown | 272 | 0 | 125 | 397 |
| [docs/superpowers/specs/2026-07-07-merchant-ai-efficiency-design.md](/docs/superpowers/specs/2026-07-07-merchant-ai-efficiency-design.md) | Markdown | 242 | 0 | 85 | 327 |
| [e2e/distributor-portal.spec.ts](/e2e/distributor-portal.spec.ts) | TypeScript | 20 | 0 | 2 | 22 |
| [e2e/gaps-store.spec.ts](/e2e/gaps-store.spec.ts) | TypeScript | 49 | 0 | 7 | 56 |
| [e2e/merchant-plugins.spec.ts](/e2e/merchant-plugins.spec.ts) | TypeScript | 2 | 0 | 0 | 2 |
| [e2e/phase-2-store.spec.ts](/e2e/phase-2-store.spec.ts) | TypeScript | 4 | 0 | 0 | 4 |
| [e2e/phase-3-inventory.spec.ts](/e2e/phase-3-inventory.spec.ts) | TypeScript | 52 | 0 | 7 | 59 |
| [package.json](/package.json) | JSON | 6 | 0 | 0 | 6 |
| [packages/shared/src/admin-ai.ts](/packages/shared/src/admin-ai.ts) | TypeScript | 28 | 0 | 6 | 34 |
| [packages/shared/src/admin-rbac.ts](/packages/shared/src/admin-rbac.ts) | TypeScript | 3 | 0 | 0 | 3 |
| [packages/shared/src/ai-logging.ts](/packages/shared/src/ai-logging.ts) | TypeScript | 47 | 0 | 8 | 55 |
| [packages/shared/src/ai-stream-client.ts](/packages/shared/src/ai-stream-client.ts) | TypeScript | 64 | 0 | 12 | 76 |
| [packages/shared/src/ai-stream.ts](/packages/shared/src/ai-stream.ts) | TypeScript | 109 | 0 | 21 | 130 |
| [packages/shared/src/ai.ts](/packages/shared/src/ai.ts) | TypeScript | 22 | 0 | 6 | 28 |
| [packages/shared/src/crm-ai.ts](/packages/shared/src/crm-ai.ts) | TypeScript | 16 | 0 | 3 | 19 |
| [packages/shared/src/ecommerce.ts](/packages/shared/src/ecommerce.ts) | TypeScript | 1 | 0 | 0 | 1 |
| [packages/shared/src/flagship-catalog.ts](/packages/shared/src/flagship-catalog.ts) | TypeScript | 9 | 0 | 2 | 11 |
| [packages/shared/src/i18n/messages/en/admin.ts](/packages/shared/src/i18n/messages/en/admin.ts) | TypeScript | 107 | 0 | 0 | 107 |
| [packages/shared/src/i18n/messages/en/distributor.ts](/packages/shared/src/i18n/messages/en/distributor.ts) | TypeScript | 1 | 0 | 0 | 1 |
| [packages/shared/src/i18n/messages/en/merchant.ts](/packages/shared/src/i18n/messages/en/merchant.ts) | TypeScript | 79 | 0 | 0 | 79 |
| [packages/shared/src/i18n/messages/en/store.ts](/packages/shared/src/i18n/messages/en/store.ts) | TypeScript | 45 | 0 | 0 | 45 |
| [packages/shared/src/i18n/messages/zh-CN/admin.ts](/packages/shared/src/i18n/messages/zh-CN/admin.ts) | TypeScript | 91 | 0 | 0 | 91 |
| [packages/shared/src/i18n/messages/zh-CN/distributor.ts](/packages/shared/src/i18n/messages/zh-CN/distributor.ts) | TypeScript | 1 | 0 | 0 | 1 |
| [packages/shared/src/i18n/messages/zh-CN/merchant.ts](/packages/shared/src/i18n/messages/zh-CN/merchant.ts) | TypeScript | 65 | 0 | 0 | 65 |
| [packages/shared/src/i18n/messages/zh-CN/store.ts](/packages/shared/src/i18n/messages/zh-CN/store.ts) | TypeScript | 39 | 0 | 0 | 39 |
| [packages/shared/src/index.ts](/packages/shared/src/index.ts) | TypeScript | 9 | 0 | 0 | 9 |
| [packages/shared/src/media.ts](/packages/shared/src/media.ts) | TypeScript | 28 | 0 | 4 | 32 |
| [packages/shared/src/merchant-ai.ts](/packages/shared/src/merchant-ai.ts) | TypeScript | 49 | 0 | 9 | 58 |
| [packages/shared/src/phase-5-allocation.ts](/packages/shared/src/phase-5-allocation.ts) | TypeScript | 20 | 0 | 2 | 22 |
| [packages/shared/src/phase-5-distribution.ts](/packages/shared/src/phase-5-distribution.ts) | TypeScript | 4 | 0 | 0 | 4 |
| [packages/shared/src/store-account.ts](/packages/shared/src/store-account.ts) | TypeScript | 32 | 0 | 6 | 38 |
| [packages/ui/package.json](/packages/ui/package.json) | JSON | 3 | 0 | 0 | 3 |
| [packages/ui/src/components/image-upload-gallery.tsx](/packages/ui/src/components/image-upload-gallery.tsx) | TypeScript JSX | 210 | 1 | 17 | 228 |
| [packages/ui/src/components/markdown-content.tsx](/packages/ui/src/components/markdown-content.tsx) | TypeScript JSX | 23 | 0 | 5 | 28 |
| [packages/ui/src/components/markdown-editor.tsx](/packages/ui/src/components/markdown-editor.tsx) | TypeScript JSX | 34 | 0 | 6 | 40 |
| [packages/ui/src/components/shells/admin-shell.tsx](/packages/ui/src/components/shells/admin-shell.tsx) | TypeScript JSX | 2 | 0 | 0 | 2 |
| [packages/ui/src/components/shells/store-shell.tsx](/packages/ui/src/components/shells/store-shell.tsx) | TypeScript JSX | 5 | 0 | -5 | 0 |
| [packages/ui/src/components/store/store-account-settings-form.tsx](/packages/ui/src/components/store/store-account-settings-form.tsx) | TypeScript JSX | 151 | 0 | 10 | 161 |
| [packages/ui/src/components/store/store-account-sidebar.tsx](/packages/ui/src/components/store/store-account-sidebar.tsx) | TypeScript JSX | -31 | 0 | -1 | -32 |
| [packages/ui/src/components/store/store-address-form.tsx](/packages/ui/src/components/store/store-address-form.tsx) | TypeScript JSX | 189 | 0 | 9 | 198 |
| [packages/ui/src/components/store/store-address-list.tsx](/packages/ui/src/components/store/store-address-list.tsx) | TypeScript JSX | 134 | 0 | 7 | 141 |
| [packages/ui/src/index.ts](/packages/ui/src/index.ts) | TypeScript | 22 | 0 | 0 | 22 |
| [playwright.config.ts](/playwright.config.ts) | TypeScript | 12 | 0 | 0 | 12 |
| [playwright.ppt.config.ts](/playwright.ppt.config.ts) | TypeScript | 65 | 0 | 3 | 68 |
| [pnpm-lock.yaml](/pnpm-lock.yaml) | YAML | 1,201 | 0 | 319 | 1,520 |

[Summary](results.md) / [Details](details.md) / [Diff Summary](diff.md) / Diff Details