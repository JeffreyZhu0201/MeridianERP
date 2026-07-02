# MeridianERP — 产品需求总结

**版本:** 1.0.0
**更新日期:** 2026-07-01
**状态:** Phase 1-5 全部完成

---

## 项目概述

MeridianERP 是一个多租户 SaaS ERP 系统，面向**工厂总部 · 分店 · B2B 渠道经销商**，集成以下核心能力：

- **CRM** — 客户关系管理、Pipeline 阶段、活动记录
- **配额/补货** — MasterSku 配额分配、补货请求
- **佣金结算** — 经销商佣金账本、提现审批
- **消费者店面** — 商品目录、购物车、结账、自提/配送履约
- **AI Agent 诊断** — 运营诊断分析

四个前端门户共享一个 NestJS API：

| 门户 | App | 端口 | 受众 |
|------|-----|------|------|
| 平台管理后台 | `apps/admin` | 3000 | 平台运营人员 |
| 商户后台 | `apps/merchant` | 3002 | 商户员工 |
| 消费者商店 | `apps/store` | 3003 | 终端消费者 |
| 经销商门户 | `apps/distributor` | 3005 | 经销商（只读） |

---

## 业务架构

```
┌─────────────────────────────────────┐
│     🏢 平台 / 工厂总部 (Admin)        │
│  MasterSku · 配额分配 · CRM           │
│  渠道伙伴 · 资金结算                   │
│  配送队列 (DELIVERY 订单)             │
└──────────────┬──────────────────────┘
               │ 分配货物
               │ 审批商户
┌──────────────▼──────────────────────┐
│   🤝 渠道经销商 (Distributor)          │
│   仅 B2B — 招募分店                    │
│   获取招募分店 GMV 的佣金               │
└──────────────┬──────────────────────┘
               │ 邀请 → 注册 → 审批
┌──────────────▼──────────────────────┐
│   🏪 分店商户 (Merchant tenant)       │
│   recruitedByDistributorId 关联       │
│   销售 · 自提核销 · 资金               │
└──────────────┬──────────────────────┘
               │ 销售给
┌──────────────▼──────────────────────┐
│   🛒 终端客户 (Store)                  │
│   自提 @ 分店 · 配送 @ 总部            │
└─────────────────────────────────────┘
```

---

## 阶段状态

| 阶段 | 范围 | API | Admin UI | Merchant UI | Store UI | 完成日期 |
|------|------|-----|----------|-------------|----------|----------|
| **Phase 1** | 认证、CRM、商户入驻、QR绑定 | ✅ | ⚠️ 部分 | ⚠️ 部分 | — | 2025-07-10 |
| **Phase 2** | 电商、佣金、结算 | ✅ | ⚠️ 部分 | ⚠️ 仅目录 | ✅ 核心 | 2025-08-05 |
| **Phase 3** | 库存、仓库、采购订单、调拨 | ✅ | ⚠️ 只读 | ✅ | — | 2025-09-10 |
| **Phase 4** | 经销商门户、佣金增强 | ✅ | ⚠️ 部分 | ✅ | — | 2025-10-20 |
| **Phase 5** | 配额履约、资金总览、平台CRM、AI诊断 | ✅ | ⚠️ 部分 | ⚠️ 部分 | — | 2026-06-30 |
| **Settings** | 平台+商户设置、团队管理 | ✅ | ✅ | ✅ | — | — |

**图例:** ✅ 完成 · ⚠️ 部分 · ❌ 未开始

---

## 核心功能详情

### 认证与多租户

- **JWT 领域**: `admin`, `merchant`, `store`, `distributor`
- **租户隔离**: 通过 `tenantId` 实现数据隔离
- **独立密钥**:
  - `JWT_SECRET` — 平台管理员
  - `JWT_MERCHANT_SECRET` — 商户用户
  - `JWT_STORE_SECRET` — 商店消费者
  - `JWT_DISTRIBUTOR_SECRET` — 渠道经销商
- **Cookie 命名空间**: 每门户独立 (`admin_token`, `merchant_token`, etc.)

### 平台管理 (Admin)

| 功能 | 描述 |
|------|------|
| MasterSku 目录 | 总部主 SKU 管理 |
| 配额分配 | AllocationOrder 向渠道/商户分配 |
| 渠道伙伴 | Distributor 管理 |
| 商户审批 | DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED/REJECTED |
| 资金管理 | 平台资金、结算 |
| 平台 CRM | 客户 Pipeline (NEW → QUALIFIED → WON/LOST) |

### 经销商门户 (Distributor)

| 功能 | 描述 |
|------|------|
| 分店招募 | 邀请码招募新商户 |
| 业绩查看 | GMV、订单统计 |
| 佣金账本 | SETTLED 状态佣金记录 |
| 提现申请 | 佣金提现请求与审批 |
| 经销商树 | 上级/下级关系视图 |

### 商户后台 (Merchant)

| 功能 | 描述 |
|------|------|
| 库存管理 | 库存调整、仓库管理 |
| 销售订单 | 订单列表、核销 |
| 自提核销 | PICKUP 订单核销验证 |
| 店铺资金 | 资金余额、流水 |
| 补货请求 | 向总部提交 ReplenishmentRequest |

### 商店前端 (Store)

| 功能 | 描述 |
|------|------|
| 商品目录 | 公开浏览、分类筛选 |
| 购物车 | 访客/登录用户 |
| 结账支付 | Stripe Payment Element |
| 订单历史 | 消费者账户订单 |
| 履约方式 | 自提/配送选择 |
| 二维码验证 | 消费者 QR 绑定追溯 |

---

## 关键业务规则

### 佣金计算

- **触发时机**: 订单状态达到 `FULFILLED`（自提核销或总部发货）时触发
- **归属**: 通过 `MerchantProfile.recruitedByDistributorId` 关联分店与经销商
- **余额**: `Σ SETTLED 佣金 − Σ 已批准提现`

### 履约模式

| 履约方式 | 支付后 | 库存扣减 | 完成条件 |
|----------|--------|----------|----------|
| **自提 PICKUP** | 待核销列表；不扣分店库存 | 核销时扣分店默认仓 | `POST .../verify-pickup` → FULFILLED |
| **配送 DELIVERY** | 总部配送队列；不扣分店库存 | 发货时扣 `MasterSku` 主仓 | `POST /platform/orders/:id/ship` → FULFILLED |

### 商户入驻状态

```
DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED | REJECTED
```

登录阻塞直到状态为 `APPROVED`。

### CRM Pipeline

阶段: `NEW` → `QUALIFIED` → `WON | LOST`

活动类型: `CALL`, `NOTE`, `MEETING`

### QR 绑定

- HMAC 签名 JWT，包含 `distributorId`, `tenantId`, `bindType`, `exp`
- 7 天有效期
- 每个商户唯一绑定

---

## API 路由结构

前缀 `/api/v1`:

| 前缀 | 控制器 | 守卫 | 描述 |
|------|--------|------|------|
| `platform/*` | Platform*Controller | PlatformAuthGuard | 平台管理员操作 |
| `merchant/*` | Merchant*Controller | MerchantAuthGuard | 商户操作 |
| `store/:slug/*` | Store*Controller | StoreAuthGuard | 商店前端 |
| `bindings/*` | BindingsController | 混合 | 经销商-商户绑定 |
| `distributor/*` | Distributor*Controller | DistributorAuthGuard | 渠道伙伴操作 |

### API 模块

```
apps/api/src/
├── auth/              # JWT 策略 + 守卫
├── platform/         # 平台操作
├── merchant/         # 商户操作
├── store/            # 商店前端
├── distributor/      # 渠道伙伴
├── fulfillment/      # 配送/自提
├── commission/       # 佣金账本
├── inventory/        # 库存/仓库
├── bindings/         # 绑定关系
├── payment/          # Stripe
├── queue/            # BullMQ
└── prisma/           # PrismaService
```

---

## 新增功能指南

### 必需文档

新增功能时必须创建以下文档：

1. **`docs/prd/<feature>.md`** — 产品需求
   - Problem statement
   - 用户画像表
   - 用户故事表（Given/When/Then 格式）
   - P0/P1/P2 优先级
   - 验收标准（可测试）

2. **`docs/architecture/<feature>.md`** — 架构设计
   - API 契约
   - 数据模型 (Prisma)
   - 模块边界
   - BullMQ 异步任务
   - Redis 缓存策略

3. **`docs/design/<feature>.md`** — UI 设计
   - 界面规范
   - 组件映射到 shadcn/ui

### 阶段工作流

```
Discovery → Architecture → UI Spec → Implementation → Verification → Shipping → GitHub PR
  (PM)         (Architect)    (UI Designer)  (FE + BE)       (QA)        (DevOps)
```

---

## 测试要求

| 测试类型 | 工具 | 覆盖目标 |
|----------|------|----------|
| 前端单元 | Vitest | 组件逻辑 |
| 后端单元 | Jest/Vitest | Service 逻辑 |
| API 集成 | Supertest | 端点契约 |
| E2E | Playwright | 关键流程 |

- 每个 P0 验收标准至少映射到一个测试
- 覆盖率目标: P0 功能 ≥80%，认证/支付关键路径 ≥90%
- 测试命名: `describe('<Unit>')` → `it('should <behavior> when <condition>')`

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | Next.js 15 App Router |
| UI 组件 | shadcn/ui + Tailwind CSS v4 |
| 后端框架 | NestJS 11 |
| 数据库 | PostgreSQL 16 + Prisma ORM |
| 缓存/队列 | Redis 7 + BullMQ |
| 支付 | Stripe (mock 模式) |
| Monorepo | pnpm workspaces + Turborepo |
| LLM | OpenAI GPT-4o / Anthropic Claude |

---

## 相关文档索引

| 类别 | 路径 |
|------|------|
| 功能报告 | `docs/reports/功能报告.md` |
| Git 工作流 | `docs/execution/git-workflow.md` |
| Phase 1 PRD | `docs/prd/phase-1-foundation.md` |
| Phase 2 PRD | `docs/prd/phase-2-ecommerce.md` |
| Phase 3 PRD | `docs/prd/phase-3-inventory.md` |
| Phase 4 PRD | `docs/prd/phase-4-distributor-enhancements.md` |
| Phase 5 PRD | `docs/prd/phase-5-distribution-and-allocation.md` |
| Phase 5 架构 | `docs/architecture/phase-5-distribution-and-allocation.md` |
| Cursor 规则 | `.cursor/rules/*.mdc` |
| Cursor 代理 | `.cursor/agents/*.md` |
