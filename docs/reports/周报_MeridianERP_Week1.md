# MeridianERP 项目周报 — 第一周

| 项目名称 | 新一代AI Agent企业全流程数字化管理平台（MeridianERP） |
|----------|----------------------------------------------------------|
| 项目编号 | QTWBJFXT20250904 |
| 报告周期 | 2025-06-24 ~ 2025-06-30（第一周） |
| 填表日期 | 2025-06-30 |
| 填表人 | __________ |
| 审核人 | __________ |

武汉学链科技有限公司
版权所有  不得复制

---

## 一、项目进展情况

本周为项目启动第一周，主要完成以下工作：

**1. 项目启动与基础设施搭建**

完成 monorepo 工程化环境搭建，采用 pnpm workspaces + Turborepo 架构，创建 `apps/api`（NestJS）、`apps/admin`、`apps/merchant`、`apps/store` 四个应用骨架，以及 `packages/shared`、`packages/ui` 两个共享包。配置 TypeScript 严格模式、ESLint/Biome 代码规范，初始化 GitHub 仓库并建立 main/develop 分支保护规则。

**2. 数据库与认证体系设计**

完成 Prisma schema 核心模型设计，涵盖 `Tenant`（租户）、`PlatformUser`（平台用户）、`User`（商户用户）、`MerchantProfile`（商户档案）等基础实体，确立 `tenantId` 多租户隔离模式。设计四域 JWT 认证架构：admin/merchant/store/distributor 各自独立密钥和 Cookie 命名空间，完成 `JwtPayload` 接口定义与 `TenantInterceptor` 全局拦截器原型。

**3. 商户入驻流程开发**

完成商户注册与入驻基础流程：`MerchantProfile` 五状态模型（DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED/REJECTED），实现平台端 `POST /platform/merchants/:id/approve` 和 `POST /platform/merchants/:id/reject` 接口，入驻审批通过后自动创建 Tenant slug 并激活商户 Owner 账号。

**4. 文档交付**

完成 `docs/architecture/system-overview.md` 平台设计规格说明书，以及 Phase 1 PRD 和架构文档初稿，明确第一阶段的交付范围和验收标准。

---

## 二、问题

**1. 数据库选型待确认**

当前设计基于 PostgreSQL + Prisma ORM，团队对 Prisma Postgres 托管服务的连接池限制和多租户查询性能尚需实测验证。本地 Docker Postgres 环境已就绪，但生产环境方案需进一步评估。

**2. JWT 密钥管理方案未明确**

四域 JWT 需要独立密钥，当前使用 `.env` 文件管理，缺乏密钥轮换和密钥泄露应对方案。需在下一阶段确定是否需要引入 Vault 或云 KMS 服务。

**3. 前端 UI 规范尚未统一**

`packages/ui` 组件库尚未搭建，Admin 和 Merchant 前端页面缺少统一的 Shell 布局组件和页面框架（ListPageFrame/DetailPageFrame/FormPageFrame），存在各门户各自实现的风险。

---

## 三、下一步工作任务安排

| 序号 | 任务 | 负责人 | 计划完成日期 | 优先级 |
|------|------|--------|-------------|--------|
| 1 | 完成商户入驻完整流程 API（含邮件通知队列） | 待定 | 2025-07-03 | P0 |
| 2 | Admin 前端商户列表页与审核 UI | 待定 | 2025-07-04 | P0 |
| 3 | Merchant 前端登录页与入驻表单 | 待定 | 2025-07-05 | P0 |
| 4 | 搭建 `packages/ui` Shell 组件体系（AdminShell/MerchantShell） | 待定 | 2025-07-03 | P1 |
| 5 | BullMQ 邮件队列集成（欢迎邮件、入驻审批通知） | 待定 | 2025-07-05 | P1 |
| 6 | 经销商基础模型与 QR 绑定接口 | 待定 | 2025-07-07 | P1 |
| 7 | 编写 Auth + Onboarding API E2E 测试 | 待定 | 2025-07-07 | P1 |

---

## 四、项目进度自评

| 正常 √ | 滞后延期 ☐ | 进展超前 ☐ |
|---------|-----------|-----------|

**自评说明**：本周按计划完成了 monorepo 工程化搭建、Prisma schema 核心模型设计、四域 JWT 认证架构设计以及商户入驻基础 API，各项任务均符合里程碑 M1（Phase 1 基础）的第一周进度预期，整体节奏正常。存在的前端 UI 规范和密钥管理问题已识别并纳入后续计划，暂不影响主线推进。
