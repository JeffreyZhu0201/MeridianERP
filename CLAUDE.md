# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

<!-- rtk-instructions v2 -->
<!-- 保留 RTK 令牌优化命令 -->
# RTK (Rust Token Killer) - 令牌优化命令

## 黄金法则

**始终使用 `rtk` 前缀**。RTK 有专用过滤器时使用它，否则透传。这意味着使用 RTK 始终是安全的。

**注意**：即使在 `&&` 命令链中也要使用 rtk：
```bash
# ❌ 错误
git add . && git commit -m "msg" && git push

# ✅ 正确
rtk git add . && rtk git commit -m "msg" && rtk git push
```

## 常用命令速查

### 开发
```bash
rtk pnpm dev              # 启动所有应用 (API + 所有门户)
rtk pnpm dev:api          # 仅 API (端口 3001)
rtk pnpm dev:admin        # 仅管理门户 (端口 3000)
rtk pnpm dev:merchant     # 仅商户门户 (端口 3002)
rtk pnpm dev:store        # 仅商店前端 (端口 3003)
rtk pnpm dev:distributor  # 仅经销商门户 (端口 3005)
rtk pnpm dev:ui-spec      # UI 组件展示 (端口 3004)
```

### 数据库
```bash
rtk pnpm db:setup         # generate + migrate + seed (首次设置)
rtk pnpm db:generate      # Prisma 客户端生成
rtk pnpm db:migrate       # 数据库迁移
rtk pnpm db:seed          # 数据库播种
```

### 测试
```bash
rtk pnpm test:e2e         # 所有 Playwright E2E 测试
rtk pnpm test:e2e:ui      # 交互式调试 UI
rtk pnpm test:e2e:store   # 商店 E2E 测试
rtk pnpm test:e2e:admin    # 管理门户 E2E 测试
rtk pnpm test:e2e:merchant # 商户门户 E2E 测试
```

### 代码质量
```bash
rtk tsc                   # TypeScript 错误（按文件分组）
rtk lint                  # ESLint/Biome 违规（按文件分组）
```

### Git
```bash
rtk git status            # 紧凑状态
rtk git log               # 紧凑日志
rtk git diff              # 紧凑差异
rtk git add / commit / push # 超紧凑确认
```

### 搜索
```bash
rtk grep <pattern>         # 按文件分组的搜索结果
rtk find <pattern>         # 按目录分组的结果
```

<!-- /rtk-instructions -->

---

## 项目概述

MeridianERP 是一个多租户 SaaS ERP 系统，面向 **工厂总部 · 分店 · B2B 渠道经销商**，包含 CRM、配额/补货、佣金结算和消费者店面（自提或配送）。

### 业务角色

| 角色 | 门户 | 端口 | 职责 |
|------|------|------|------|
| **工厂总部** | `apps/admin` | 3000 | 主 SKU、配额分配、渠道伙伴管理、商户审批、资金/结算 |
| **分店** | `apps/merchant` | 3002 | 销售、自提验证、店铺资金、补货请求 |
| **渠道经销商** | `apps/distributor` | 3005 | 招募分店、查看业绩、佣金、提现 |
| **消费者** | `apps/store` | 3003 | 商店选购、自提/配送结账、二维码验证 |
| **API** | `apps/api` | 3001 | NestJS REST API |

### 技术栈

| 层级 | 技术 |
|------|------|
| 管理/商户/商店/经销商门户 | Next.js + `@meridian/ui` |
| API | NestJS + Prisma |
| 数据库 | PostgreSQL (Prisma ORM) |
| 缓存/队列 | Redis + BullMQ |
| 支付 | Stripe (mock 模式: `STRIPE_SECRET_KEY` 含 `mock`) |
| Monorepo | pnpm workspaces + Turborepo |

---

## 架构概览

### 多租户模型

- `Tenant` 是根实体，所有业务数据按 `tenantId` 隔离
- 4 种 JWT 受众：`admin`(平台)、`merchant`(商户)、`store`(消费者)、`distributor`(经销商)
- 每种受众独立 JWT 密钥：
  - `JWT_SECRET` — 平台管理员
  - `JWT_MERCHANT_SECRET` — 商户用户
  - `JWT_STORE_SECRET` — 商店消费者
  - `JWT_DISTRIBUTOR_SECRET` — 渠道经销商

### API 路由结构 (`/api/v1` 前缀)

| 前缀 | 控制器 | 守卫 | 描述 |
|------|--------|------|------|
| `platform/*` | Platform*Controller | PlatformAuthGuard | 平台管理员操作 |
| `merchant/*` | Merchant*Controller | MerchantAuthGuard | 商户操作 |
| `store/:slug/*` | Store*Controller | StoreAuthGuard | 商店前端 |
| `bindings/*` | BindingsController | 混合 | 经销商-商户绑定 |
| `distributor/*` | Distributor*Controller | DistributorAuthGuard | 渠道伙伴操作 |

### API 模块结构

```
apps/api/src/
├── auth/                 # JWT 策略 (Platform/Merchant/Store/DistributorJwtStrategy)
│   ├── strategies/       # 四种 JWT 策略
│   └── guards/           # 认证守卫 (PlatformAuthGuard 等)
├── platform/            # 平台操作 (配额、资金、订单、CRM)
├── merchant/            # 商户操作 (库存、订单、自提验证)
├── store/               # 商店前端 (目录、购物车、结账)
├── distributor/         # 渠道伙伴操作
├── fulfillment/         # 配送/自提协调
├── commission/          # 经销商佣金账本
├── inventory/           # 库存、仓库、采购订单
├── bindings/            # 经销商-商户绑定
├── payment/            # Stripe 集成
├── queue/              # BullMQ 邮件和佣金任务
├── prisma/            # Prisma 服务 (全局单例)
└── common/            # 拦截器、装饰器
```

### 共享包

| 包 | 路径 | 导出 |
|-----|------|------|
| `@meridian/shared` | `packages/shared/` | 类型、枚举、资金公式、i18n 消息 |
| `@meridian/ui` | `packages/ui/` | Shell 组件、OrderListFrame、履约对话框、UI 原语 |

---

## 数据库

- **Schema**: `apps/api/prisma/schema.prisma`
- **ORM**: Prisma (PostgreSQL)
- **多租户模式**: 大多数模型有 `tenantId` 外键
- **关键模型**: Tenant, PlatformUser, User, Customer, Order, Product, MasterSku, AllocationOrder, ReplenishmentRequest, CommissionLedger

### 关键 Prisma 模型关系

```
Tenant (根实体)
├── PlatformUser (平台用户)
├── User (商户用户)
├── Customer (消费者)
├── Product / ProductVariant (商品)
├── Order (订单)
├── Warehouse (仓库)
├── MasterSku (总部主 SKU)
└── Distributor (渠道经销商)
```

---

## 认证流程

### JWT 负载结构
```typescript
interface JwtPayload {
  sub: string;                    // 用户 ID
  aud: 'admin' | 'merchant' | 'store' | 'distributor';
  tenantId?: string;              // 商户/商店必填
  roles: string[];
}
```

### 前端认证
- 每门户独立 cookie：`admin_token`, `merchant_token`, `store_token`, `distributor_token`
- 各 Next.js 应用有 `middleware.ts` 保护路由
- API 客户端: `apps/*/lib/api.ts` 中的 `apiFetch` 封装

### 公开路径
每个门户的 `middleware.ts` 定义公开路径（登录、注册等）跳过认证。

---

## 前端架构

### ⚠️ UI Spec 优先规则

**任何 UI 工作前必须先读 ui-spec**（`.cursor/rules/ui-spec.mdc`）：

1. 打开 `apps/ui-spec/src/app/page.tsx` 找到最接近的展示示例
2. 对应查看 `apps/ui-spec/src/components/ui/<name>.tsx` 的 props 和 variants
3. 在 `packages/ui` 或门户 apps 中通过**镜像**该示例实现，不自己发明模式
4. 新模式先加到 ui-spec，再传播到 `packages/ui` 和门户 apps

```bash
rtk pnpm --filter @meridian/ui-spec dev  # http://localhost:3004
```

### Shell 组件模式
每个门户使用对应 Shell 组件包裹页面：
- `AdminShell` → 管理门户
- `MerchantShell` → 商户门户
- `StoreShell` → 商店前端
- `DistributorShell` → 经销商门户

### 页面框架组件
- `ListPageFrame` — 列表页（搜索、表格、分页）
- `DetailPageFrame` — 详情页
- `FormPageFrame` — 表单页

### 订单相关组件
- `OrderListFrame` — 订单列表
- `PickupVerifyDialog` — 自提验证对话框
- `DeliveryShipDialog` — 配送发货对话框
- `FulfillmentTypeBadge` — 履约类型标签

---

## 后台任务

### BullMQ 队列
- `EMAIL_QUEUE` — 邮件发送（欢迎、绑定、佣金、订单确认）
- `COMMISSION_QUEUE` — 订单完成后佣金计算

**开发模式**: Redis 不可用时，队列服务降级为 stub 模式（仅记录日志）。

---

## 开发工作流

### 首次设置
```bash
cp .env.example .env
pnpm install
pnpm --filter @meridian/shared build
pnpm deps          # 启动 Redis
pnpm db:setup      # generate + migrate + seed
```

### 日常开发
```bash
# 启动所有服务
rtk pnpm dev

# 或单独启动
rtk pnpm dev:api   # 先启动 API
rtk pnpm dev:admin # 再启动管理门户
```

### 测试账号
| 门户 | 邮箱 | 密码 |
|------|------|------|
| Admin | `admin@meridian.test` | `admin123` |
| Merchant | `demo@merchant.test` | `demo1234` |
| Store | 在 `/s/demo/register` 注册 | — |
| Distributor | 在 Admin → Distributors 创建 | — |

### Docker 全栈 (CI / 生产环境)
```bash
docker compose -f docker/docker-compose.yml --profile dev up --build
```
启动 postgres、redis、api 和所有前端容器。

### 前端环境变量
- 根 `.env` 的 `NEXT_PUBLIC_API_URL` 是默认值
- 各门户可通过 `apps/*/.env.local` 覆盖（如 `apps/admin/.env.local`）
- 参考 `*.env.local.example`

---

## Cursor Rules

项目使用 Cursor 的 7 阶段工作流，定义在 `.cursor/rules/workflow-orchestration.mdc`：

1. **Discovery** (product-manager) → 2. **Architecture** (architect) → 3. **UI Spec** (ui-designer) → 4. **Implementation** (nextjs-frontend + nestjs-backend) → 5. **Verification** (test-engineer) → 6. **Shipping** (devops-engineer) → 7. **GitHub PR**

专业代理定义在 `.cursor/agents/`:
- `architect.md`, `devops-engineer.md`, `nestjs-backend.md`, `nextjs-frontend.md`
- `product-manager.md`, `test-engineer.md`, `ui-designer.md`

### 关键规则

- **No implementation without PRD and architecture doc** — 每个功能需要 `docs/prd/<feature>.md` 和 `docs/architecture/<feature>.md`
- **UI Spec first** — 任何 UI 工作前，先读 `apps/ui-spec/src/app/page.tsx` 找最接近的组件示例；新模式先加到 ui-spec 再传播到 `packages/ui`
- **Shared types first** — API 共享类型先导出到 `packages/shared`，前端才能集成
- **Phase gate** — `develop → main` 合并需要 phase gate，不只是 CI green
- **End-of-phase Handoff block** 格式：
  ```
  ## Handoff
  - **Scope**: 完成范围
  - **Files**: 涉及文件
  - **Open questions**: 待决问题
  - **Next agent**: 下一步代理
  ```

### NestJS 模式示例

```typescript
// BullMQ processor
@Processor('email')
export class EmailProcessor extends WorkerHost {
  async process(job: Job<SendEmailPayload>) { /* ... */ }
}

// PrismaService 注入
constructor(private prisma: PrismaService) {}

// DTO with class-validator
export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  customerId: string;
}
```

### NextJS 模式要点

- Server Components 优先；仅在需要交互时使用 `'use client'`
- 表单：React Hook Form + Zod resolver from `@meridian/shared`
- 数据获取：Server Component 中 fetch 并转发 cookies
- Mutation：server actions 或带 toast 反馈的 client fetch

---

## CI/CD

GitHub Actions 工作流: `.github/workflows/ci.yml`

触发条件: push/PR 到 `main` 和 `develop`

流水线:
1. 安装依赖 (`pnpm install --frozen-lockfile`)
2. 构建共享包: `pnpm --filter @meridian/shared build`
3. 生成 Prisma 客户端
4. 运行 API E2E 测试
5. 构建所有应用: `pnpm build`

---

## 关键文件索引

| 文件 | 用途 |
|------|------|
| `apps/api/src/main.ts` | NestJS 引导，CORS，验证管道 |
| `apps/api/src/app.module.ts` | 根模块，导入所有功能模块 |
| `apps/api/prisma/schema.prisma` | 完整数据库 schema |
| `packages/shared/src/index.ts` | 共享类型导出 |
| `packages/ui/src/index.ts` | UI 组件导出 |
| `apps/*/middleware.ts` | 各应用路由保护 |
| `packages/shared/src/i18n/messages/` | i18n 消息 (en, zh-CN) |

## 重要文档

| 文档 | 路径 |
|------|------|
| 功能报告 | `docs/reports/功能报告.md` |
| Git & PR 工作流 | `docs/execution/git-workflow.md` |
| Phase 5 PRD | `docs/prd/phase-5-distribution-and-allocation.md` |
| Phase 5 架构 | `docs/architecture/phase-5-distribution-and-allocation.md` |

---

## 故障排除

| 问题 | 解决 |
|------|------|
| 端口占用 | `lsof -i :3000` 然后 `kill <PID>`，重启 `rtk pnpm dev` |
| API 错误/仪表盘空白 | 先启动 `rtk pnpm dev:api`；检查 `NEXT_PUBLIC_API_URL=http://localhost:3001` |
| Redis 连接错误 | `rtk pnpm deps` 确认 Docker 运行 |
| JWT 密钥缺失 | 在 `.env` 中添加 `JWT_DISTRIBUTOR_SECRET`，重启 API |
| Next.js 启动失败 | 不要在 `pnpm dev:*` 命令同一行加 shell 注释，使用单独命令运行 |
