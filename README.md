# MeridianERP

<!-- shields: version, phases, license -->
![Version](https://img.shields.io/badge/version-1.0.0--phase5-blue) ![Phase](https://img.shields.io/badge/phase-5_%E5%AE%8C%E6%88%90-greene) ![License](https://img.shields.io/badge/license-private-red) ![Node](https://img.shields.io/badge/node-22%2B-green) ![Pnpm](https://img.shields.io/badge/pnpm-9.15%2B-orange)

---

> **新一代 AI Agent 企业全流程数字化管理平台** — 多租户 SaaS ERP，面向工厂总部 · 分店 · B2B 渠道经销商，集成 CRM、配额/补货、佣金结算、消费者店面（自提/配送）及 AI Agent 运营诊断。

**当前版本**: v1.0.0 (Phase 5 Complete) · 2026-07-01
**项目编号**: QTWBJFXT20250904

---

## 目录

- [快速开始](#快速开始)
- [核心命令一览](#核心命令一览)
- [项目架构](#项目架构)
- [业务模型](#业务模型)
- [技术栈](#技术栈)
- [开发状态](#开发状态)
- [种子账号](#种子账号)
- [故障排除](#故障排除)
- [相关文档](#相关文档)

---

## 快速开始

### 环境要求

| 工具 | 版本要求 |
|------|----------|
| Node.js | ≥ 22 |
| pnpm | ≥ 9.15 |
| Docker Desktop | 最新版（用于 Redis + Postgres 本地开发） |

### 首次设置

```bash
# 1. 复制环境变量文件
cp .env.example .env

# 2. 安装依赖
pnpm install

# 3. 构建共享包（必须先于其他应用启动）
pnpm --filter @meridian/shared build

# 4. 启动基础设施（Redis）
rtk pnpm deps

# 5. 初始化数据库（迁移 + 种子数据）
rtk pnpm db:setup

# 6. 启动所有服务
rtk pnpm dev
```

> ⚠️ **重要**：`.env` 已配置本地 Docker Postgres，无需额外设置。

---

## 核心命令一览

### 开发命令

| 命令 | 说明 |
|------|------|
| `rtk pnpm dev` | 启动所有应用（API + 全部门户），Turborepo 并行 |
| `rtk pnpm dev:api` | 仅启动 NestJS API（端口 3001） |
| `rtk pnpm dev:admin` | 仅启动 Admin 管理后台（端口 3000） |
| `rtk pnpm dev:merchant` | 仅启动 Merchant 商户后台（端口 3002） |
| `rtk pnpm dev:store` | 仅启动 Store 商店前端（端口 3003） |
| `rtk pnpm dev:distributor` | 仅启动 Distributor 经销商门户（端口 3005） |
| `rtk pnpm dev:ui-spec` | 启动 UI 组件展示（端口 3004，可选） |

### 数据库命令

| 命令 | 说明 |
|------|------|
| `rtk pnpm db:generate` | 生成 Prisma 客户端 |
| `rtk pnpm db:migrate` | 执行数据库迁移 |
| `rtk pnpm db:seed` | 播种种子数据 |
| `rtk pnpm db:setup` | 完整初始化（generate + migrate + seed） |
| `rtk pnpm deps` | 启动 Docker Redis（`docker compose up -d redis`） |

### 代码质量

| 命令 | 说明 |
|------|------|
| `rtk tsc` | TypeScript 类型检查（按文件分组输出） |
| `rtk lint` | ESLint/Biome 代码规范检查 |
| `rtk build` | 全量构建（所有 workspace 包） |

### 测试命令

| 命令 | 说明 |
|------|------|
| `rtk pnpm test:e2e` | 所有 Playwright E2E 测试 |
| `rtk pnpm test:e2e:ui` | Playwright 交互式调试 UI |
| `rtk pnpm test:e2e:store` | 商店 E2E 测试 |
| `rtk pnpm test:e2e:admin` | Admin 管理后台 E2E 测试 |
| `rtk pnpm test:e2e:merchant` | Merchant 商户后台 E2E 测试 |

### Git 命令

| 命令 | 说明 |
|------|------|
| `rtk git status` | 紧凑 git 状态 |
| `rtk git log` | 紧凑 git 日志 |
| `rtk git diff` | 紧凑差异查看 |
| `rtk git add / commit / push` | 超紧凑提交确认 |

### 搜索命令

| 命令 | 说明 |
|------|------|
| `rtk grep <pattern>` | 按文件分组搜索 |
| `rtk find <pattern>` | 按目录分组搜索 |

### Docker 全栈

```bash
# 启动完整开发环境（postgres + redis + api + 所有前端）
docker compose -f docker/docker-compose.yml --profile dev up --build
```

---

## 项目架构

### Monorepo 结构

```
MeridianERP/
├── apps/
│   ├── admin/          # 🏢 工厂总部管理后台     (port 3000)
│   ├── merchant/       # 🏪 分店商户后台         (port 3002)
│   ├── store/          # 🛒 消费者商店前端       (port 3003)
│   ├── distributor/    # 🤝 渠道经销商门户       (port 3005)
│   ├── api/            # ⚙️  NestJS REST API    (port 3001)
│   └── ui-spec/        # 🎨  UI 组件展示（可选）(port 3004)
├── packages/
│   ├── shared/         # 📦 共享类型、枚举、资金公式、i18n
│   └── ui/             # 🧩 Shell 组件、OrderListFrame、履约对话框
├── docs/               # 📋 PRD、架构、设计、报告文档
├── docker/             # 🐳 Docker Compose + Dockerfiles
└── e2e/               # ⚡ Playwright E2E 冒烟测试
```

### 服务端口映射

| 服务 | 端口 | URL |
|------|------|-----|
| API | 3001 | http://localhost:3001 |
| Admin | 3000 | http://localhost:3000 |
| Merchant | 3002 | http://localhost:3002 |
| Store | 3003 | http://localhost:3003/s/demo |
| Distributor | 3005 | http://localhost:3005 |
| UI Spec | 3004 | http://localhost:3004 |

### API 模块架构

```
apps/api/src/
├── auth/                 # JWT 策略（四域认证）
│   ├── strategies/       # Platform / Merchant / Store / DistributorJwtStrategy
│   ├── guards/           # PlatformAuthGuard / MerchantAuthGuard / StoreAuthGuard / DistributorAuthGuard
│   └── decorators/       # @CurrentUser / @Public
├── platform/            # 平台操作（配额、资金、订单、CRM）
├── merchant/            # 商户操作（库存、订单、自提验证）
├── store/               # 商店前端（目录、购物车、结账）
├── distributor/         # 渠道伙伴操作（佣金、提现）
├── fulfillment/         # 配送/自提协调
├── commission/          # 经销商佣金账本
├── inventory/           # 库存、仓库、采购订单
├── bindings/            # 经销商-商户绑定
├── payment/            # Stripe 集成
├── queue/              # BullMQ 邮件和佣金任务
├── prisma/            # Prisma 服务（全局单例）
├── ai/                 # AI Agent 诊断模块
│   ├── diagnosis/       # 诊断服务、Tool 实现
│   └── llm/            # LLM Client（OpenAI / Anthropic）
└── common/            # 拦截器、装饰器
```

### 多租户 JWT 认证架构

```
┌─────────────────────────────────────────────────────┐
│                   JWT 四域认证                        │
├──────────┬──────────┬──────────┬───────────────────┤
│  admin   │ merchant │  store   │   distributor      │
│  平台管理员 │  商户用户  │  消费者   │     渠道经销商      │
├──────────┴──────────┴──────────┴───────────────────┤
│ JWT_SECRET      │ JWT_MERCHANT_SECRET               │
│ JWT_STORE_SECRET│ JWT_DISTRIBUTOR_SECRET            │
├──────────┬──────────┬──────────┬───────────────────┤
│cookie:   │cookie:   │cookie:   │cookie:            │
│admin_    │merchant_ │store_    │distributor_       │
│token     │token     │token     │token              │
└──────────┴──────────┴──────────┴───────────────────┘
```

### 前端 Shell 组件模式

| Shell 组件 | 门户 | 路由前缀 |
|------------|------|----------|
| `AdminShell` | Admin 管理后台 | `/admin/*` |
| `MerchantShell` | Merchant 商户后台 | `/merchant/*` |
| `StoreShell` | Store 商店前端 | `/s/[slug]/*` |
| `DistributorShell` | Distributor 经销商门户 | `/distributor/*` |

### 共享包职责

| 包 | 路径 | 导出内容 |
|----|------|----------|
| `@meridian/shared` | `packages/shared/` | 类型定义、枚举、资金公式、i18n 消息 |
| `@meridian/ui` | `packages/ui/` | Shell 组件、OrderListFrame、履约对话框、UI 原语 |

---

## 业务模型

```
                    ┌─────────────────────────────────────┐
                    │     🏢 Platform / Factory (Admin)     │
                    │  MasterSku · Allocation · CRM         │
                    │  Channel partners · Withdrawals       │
                    │  Delivery queue (DELIVERY orders)     │
                    └──────────────┬──────────────────────┘
                                   │ allocates goods
                                   │ approves branches
                    ┌──────────────▼──────────────────────┐
                    │   🤝 Channel partner (Distributor)     │
                    │   B2B only — recruits branch stores   │
                    │   Earns % of recruited branch GMV      │
                    └──────────────┬──────────────────────┘
                                   │ invite → register → approved
                    ┌──────────────▼──────────────────────┐
                    │   🏪 Branch store (Merchant tenant)    │
                    │   recruitedByDistributorId            │
                    │   Sales · pickup verify · funds       │
                    └──────────────┬──────────────────────┘
                                   │ sells to
                    ┌──────────────▼──────────────────────┐
                    │   🛒 End customer (Store)            │
                    │   PICKUP @ branch · DELIVERY @ HQ    │
                    └─────────────────────────────────────┘
```

### 佣金触发规则

- **计提时机**：订单状态达到 `FULFILLED`（自提核销 或 总部发货）时触发
- **归属**：通过 `MerchantProfile.recruitedByDistributorId` 关联分店与经销商
- **提现**：余额 = Σ **SETTLED** 佣金 − Σ 已批准提现

### 履约模式

| 履约方式 | 支付后 | 库存扣减 | 完成条件 |
|----------|--------|----------|----------|
| **自提 PICKUP** | 待核销列表；不扣分店库存 | 核销时扣分店默认仓 | `POST .../verify-pickup` → FULFILLED |
| **配送 DELIVERY** | 总部配送队列；不扣分店库存 | 发货时扣 `MasterSku` 主仓 | `POST /platform/orders/:id/ship` → FULFILLED |

---

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| **前端框架** | Next.js 15 App Router | 全部四个门户 |
| **UI 组件库** | shadcn/ui + Tailwind CSS v4 | 组件规范见 `apps/ui-spec` |
| **后端框架** | NestJS 11 | 统一 API |
| **数据库** | PostgreSQL 16 + Prisma ORM | 多租户隔离 |
| **缓存/队列** | Redis 7 + BullMQ | 邮件任务、佣金异步计算 |
| **支付** | Stripe | mock 模式（`STRIPE_SECRET_KEY` 含 `mock`） |
| **Monorepo** | pnpm workspaces + Turborepo | 统一依赖管理 |
| **LLM** | OpenAI GPT-4o / Anthropic Claude | AI Agent 诊断（可切换） |

---

## 开发状态

| Phase | 范围 | 状态 | 完成日期 |
|-------|------|------|----------|
| **Phase 1** | 认证、CRM、商户入驻、经销商 QR 绑定 | ✅ 完成 | 2025-07-10 |
| **Phase 2** | 电商商店、佣金结算 | ✅ 完成 | 2025-08-05 |
| **Phase 3** | 库存、仓库、采购订单 | ✅ 完成 | 2025-09-10 |
| **Phase 4** | 渠道增强、绑定体系、佣金增强 | ✅ 完成 | 2025-10-20 |
| **Phase 5** | 配额履约、资金总览、平台 CRM、AI Agent 诊断 | ✅ 完成 | 2026-06-30 |
| **v1.0.0** | 整体交付 | ✅ 完成 | 2026-07-01 |

---

## 种子账号

| 门户 | 地址 | 账号 | 密码 |
|------|------|------|------|
| 🏢 **Admin** | http://localhost:3000 | `admin@meridian.test` | `admin123` |
| 🏪 **Merchant** | http://localhost:3002 | `demo@merchant.test` | `demo1234` |
| 🛒 **Store** | http://localhost:3003/s/demo | 在 `/s/demo/register` 注册 | — |
| 🤝 **Distributor** | http://localhost:3005 | 在 Admin → Distributors 创建并开通门户 | — |

---

## 故障排除

| 症状 | 解决方案 |
|------|----------|
| 端口占用（3000/3001/3002/3003/3005） | `lsof -i :<端口>` → `kill -9 <PID>`，然后重启 |
| 页面挂起或一直加载 | 同上杀进程后执行 `rtk pnpm dev` 重启 |
| API 错误或仪表盘空白 | 确认 API 已启动（`rtk pnpm dev:api`）；检查 `NEXT_PUBLIC_API_URL=http://localhost:3001` |
| `JWT_DISTRIBUTOR_SECRET` 缺失 | 在 `.env` 中添加该密钥，从 `.env.example` 复制 |
| Redis 连接错误 | `rtk pnpm deps` 确认 Docker 运行中 |
| NestJS TypeScript 编译错误 | 检查 `apps/api/src/` 下模块文件是否有正确的 import 语句（参考 `prisma.module.ts`） |
| 前端页面样式异常 | 确认 `packages/shared` 已构建：`pnpm --filter @meridian/shared build` |

> 💡 **提示**：Next.js 会将同一行的 shell 注释当作 CLI 参数。启动单个服务时不要在同一行加注释。
> ```bash
> # ❌ 错误
> rtk pnpm dev:admin  # 启动 admin
>
> # ✅ 正确
> rtk pnpm dev:admin
> ```

---

## 相关文档

| 文档 | 路径 |
|------|------|
| 📄 **功能报告（Phase 5）** | [docs/reports/功能报告.md](docs/reports/功能报告.md) |
| 📋 **立项报告** | [docs/reports/立项报告_MeridianERP_v1.0.md](docs/reports/立项报告_MeridianERP_v1.0.md) |
| 📋 **第一周周报** | [docs/reports/周报_MeridianERP_Week1.md](docs/reports/周报_MeridianERP_Week1.md) |
| 🏗️ **Phase 5 架构** | [docs/architecture/phase-5-distribution-and-allocation.md](docs/architecture/phase-5-distribution-and-allocation.md) |
| 🎨 **Phase 5 设计** | [docs/design/phase-5-hq-branch-channel.md](docs/design/phase-5-hq-branch-channel.md) |
| 🤖 **AI 诊断设计** | [docs/superpowers/specs/2026-06-30-ai-diagnosis-agent-design.md](docs/superpowers/specs/2026-06-30-ai-diagnosis-agent-design.md) |
| 📖 **Git & PR 工作流** | [docs/execution/git-workflow.md](docs/execution/git-workflow.md) |

---

## 分支管理规则

```
main      ← 受保护，仅 release 合并
  ↑
develop   ← 默认分支，日常开发基础分支
  ↑
feature/* ← 短生命周期功能分支
```

- 新工作始终从 `develop` 分支创建
- 合并前需通过 CI 构建验证
- Phase 完成后通过 PR 合并到 `main`

---

<p align="center">
  <strong>MeridianERP v1.0.0</strong> · 2026-07-01
</p>
