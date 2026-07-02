# 企业运营基础能力设计

**版本:** 1.0
**日期:** 2026-07-02
**状态:** 设计阶段

---

## 1. 概述

### 1.1 背景

MeridianERP 完成 Phase 1-5 后，核心 B2B 电商能力已完备（认证、CRM、库存、订单、佣金、履约）。为支撑企业级运营需求，需补充三项基础能力：

1. **审计日志** — 记录全业务操作，满足合规审计需求
2. **通知中心** — 站内信 + 邮件通知，支持用户订阅偏好
3. **Webhook** — 向外部系统（ERP/财务）推送关键业务事件

### 1.2 范围

- 三个独立模块：`AuditModule`、`NotificationModule`、`WebhookModule`
- 覆盖所有关键业务操作：审批、结算、佣金、提现、订单、配送
- 目标用户：平台管理员、商户、经销商

---

## 2. 架构概览

```
apps/api/src/
├── audit/                    # 审计日志模块
│   ├── audit.module.ts
│   ├── audit.controller.ts
│   ├── audit.service.ts
│   ├── audit.processor.ts    # BullMQ 异步写入
│   └── entities/
│       └── audit-log.entity.ts
├── notification/             # 通知中心模块
│   ├── notification.module.ts
│   ├── notification.controller.ts
│   ├── notification.service.ts
│   ├── email.processor.ts    # BullMQ 邮件队列
│   └── entities/
│       ├── notification.entity.ts
│       └── notification-preference.entity.ts
└── webhook/                  # Webhook 模块
    ├── webhook.module.ts
    ├── webhook.controller.ts
    ├── webhook.service.ts
    ├── webhook.processor.ts  # BullMQ 投递队列
    └── entities/
        ├── webhook-config.entity.ts
        └── webhook-delivery.entity.ts
```

---

## 3. 模块设计

### 3.1 审计日志 (Audit)

#### 3.1.1 数据模型

```prisma
model AuditLog {
  id          String   @id @default(uuid())
  tenantId    String?  # 租户隔离（平台级操作时空）
  actorId     String   # 操作人 ID
  actorType   String   # 'platform_user' | 'user' | 'distributor' | 'system'
  actorName   String   # 操作人名称（冗余存储，便于查询）
  action      String   # 操作类型：'merchant.approve' | 'commission.settle' | ...
  resource    String   # 资源类型：'Merchant' | 'CommissionLedger' | 'Order' | ...
  resourceId  String   # 资源 ID
  payload     Json?    # 操作详情（变更前后数据）
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime @default(now())

  @@index([tenantId])
  @@index([actorId])
  @@index([action])
  @@index([resource, resourceId])
  @@index([createdAt])
}
```

#### 3.1.2 API 端点

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/platform/audit-logs` | 查询审计日志（分页 + 筛选） |
| GET | `/platform/audit-logs/:id` | 详情 |

#### 3.1.3 查询参数

| 参数 | 类型 | 描述 |
|------|------|------|
| `action` | string | 操作类型（精确匹配） |
| `resource` | string | 资源类型 |
| `actorId` | string | 操作人 ID |
| `tenantId` | string | 商户 ID（筛选该商户相关日志） |
| `startDate` | ISO8601 | 开始时间 |
| `endDate` | ISO8601 | 结束时间 |
| `page` | number | 页码 |
| `limit` | number | 每页条数（默认 20） |

#### 3.1.4 记录的操作类型

| action | 描述 | 资源 |
|--------|------|------|
| `merchant.approve` | 商户审批通过 | Merchant |
| `merchant.reject` | 商户审批拒绝 | Merchant |
| `merchant.create` | 商户创建 | Merchant |
| `commission.settle` | 佣金结算 | CommissionLedger |
| `withdrawal.approve` | 提现批准 | WithdrawalRequest |
| `withdrawal.reject` | 提现拒绝 | WithdrawalRequest |
| `order.ship` | 订单发货 | Order |
| `order.verify_pickup` | 自提核销 | Order |
| `order.paid` | 订单支付 | Order |
| `allocation.create` | 配额创建 | AllocationOrder |
| `fund.adjust` | 资金调整 | Fund |
| `replenishment.approve` | 补货批准 | ReplenishmentRequest |
| `replenishment.reject` | 补货拒绝 | ReplenishmentRequest |

#### 3.1.5 审计日志 payload 示例

```json
{
  "before": { "status": "UNDER_REVIEW" },
  "after": { "status": "APPROVED" },
  "reason": "资质审核通过"
}
```

---

### 3.2 通知中心 (Notification)

#### 3.2.1 数据模型

```prisma
model Notification {
  id          String   @id @default(uuid())
  userId      String   # 接收人 ID
  userType    String   # 'platform_user' | 'user' | 'distributor'
  type        String   # 通知类型
  title       String   # 通知标题
  content     String   # 通知内容
  data        Json?    # 额外数据（如跳转链接 { link: '/admin/merchants/xxx' }）
  isRead      Boolean  @default(false)
  readAt      DateTime?
  createdAt   DateTime @default(now())

  @@index([userId, userType, isRead])
  @@index([createdAt])
}

model NotificationPreference {
  id          String   @id @default(uuid())
  userId      String
  userType    String
  type        String   # 通知类型
  channel     String   # 'in_app' | 'email'
  enabled     Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([userId, userType, type, channel])
}
```

#### 3.2.2 API 端点

| 方法 | 路径 | 描述 | 守卫 |
|------|------|------|------|
| GET | `/notifications` | 我的通知列表 | AuthGuard |
| GET | `/notifications/unread-count` | 未读数量 | AuthGuard |
| PATCH | `/notifications/:id/read` | 标记已读 | AuthGuard |
| PATCH | `/notifications/read-all` | 全部已读 | AuthGuard |
| GET | `/notifications/preferences` | 获取偏好设置 | AuthGuard |
| PUT | `/notifications/preferences` | 更新偏好设置 | AuthGuard |

#### 3.2.3 通知类型

| type | 标题模板 | 触发场景 |
|------|----------|----------|
| `merchant.approved` | 商户审批通过 | 商户状态 → APPROVED |
| `merchant.rejected` | 商户审批拒绝 | 商户状态 → REJECTED |
| `commission.settled` | 佣金已结算 | 佣金状态 → SETTLED |
| `withdrawal.approved` | 提现已批准 | 提现状态 → APPROVED |
| `withdrawal.rejected` | 提现已拒绝 | 提现状态 → REJECTED |
| `order.paid` | 订单已支付 | 订单支付成功 |
| `order.shipped` | 订单已发货 | DELIVERY 订单发货 |
| `order.picked_up` | 订单已自提 | PICKUP 订单核销 |
| `replenishment.approved` | 补货已批准 | 补货请求批准 |
| `replenishment.rejected` | 补货已拒绝 | 补货请求拒绝 |

#### 3.2.4 邮件模板

邮件使用现有 `EMAIL_QUEUE` 队列发送。模板定义在 `packages/shared/src/i18n/messages/`：

```typescript
// 邮件标题示例
'emails.notification.subject': '{{title}}'
// 邮件正文模板
'emails.notification.body': '<h2>{{title}}</h2><p>{{content}}</p><a href="{{link}}">查看详情</a>'
```

---

### 3.3 Webhook

#### 3.3.1 数据模型

```prisma
model WebhookConfig {
  id          String    @id @default(uuid())
  name        String    # 配置名称（如 "ERP 财务系统"）
  url         String    # Webhook 目标 URL
  secret      String    # HMAC-SHA256 签名密钥
  events      String[]  # 订阅的事件类型列表
  active      Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([active])
}

model WebhookDelivery {
  id          String    @id @default(uuid())
  webhookId   String
  event       String    # 事件类型
  payload     Json      # 发送的请求体
  response    Json?     # 响应体
  status      String    # 'pending' | 'success' | 'failed'
  attempts    Int       @default(0)
  maxAttempts Int       @default(3)
  lastAttempt DateTime?
  nextRetry   DateTime? # 指数退避下次重试时间
  createdAt   DateTime  @default(now())

  @@index([webhookId, status])
  @@index([nextRetry])
}
```

#### 3.3.2 API 端点

| 方法 | 路径 | 描述 | 守卫 |
|------|------|------|------|
| GET | `/platform/webhooks` | Webhook 配置列表 | PlatformAuthGuard |
| POST | `/platform/webhooks` | 创建配置 | PlatformAuthGuard |
| PUT | `/platform/webhooks/:id` | 更新配置 | PlatformAuthGuard |
| DELETE | `/platform/webhooks/:id` | 删除配置 | PlatformAuthGuard |
| GET | `/platform/webhooks/:id/deliveries` | 投递记录 | PlatformAuthGuard |
| POST | `/platform/webhooks/:id/test` | 发送测试事件 | PlatformAuthGuard |

#### 3.3.3 Webhook 投递格式

请求头：
```
Content-Type: application/json
X-Webhook-Event: merchant.approved
X-Webhook-Signature: sha256=xxxxxx  # HMAC-SHA256(requestBody, secret)
X-Webhook-Timestamp: 1690000000
```

请求体：
```json
{
  "id": "evt_xxx",
  "type": "merchant.approved",
  "timestamp": "2026-07-02T10:00:00Z",
  "data": {
    "merchantId": "xxx",
    "merchantName": "xxx",
    "approvedAt": "2026-07-02T10:00:00Z"
  }
}
```

#### 3.3.4 重试策略

- 最大重试次数：3
- 退避策略：指数退避（1min → 5min → 30min）
- 超时时间：5 秒
- 失败状态：`status = 'failed'` 且 `attempts >= maxAttempts`

---

## 4. 前端设计

### 4.1 审计日志页面

**路径**: `/admin/audit-logs`

**布局**: `ListPageFrame`

**筛选栏**:
- 操作类型（下拉选择）
- 资源类型（下拉选择）
- 操作人（搜索）
- 时间范围（DateRangePicker）

**表格列**:
| 列 | 描述 |
|----|------|
| 时间 | createdAt |
| 操作人 | actorName |
| 操作类型 | action（Badge 显示） |
| 资源 | resource + resourceId |
| 详情 | payload 摘要 |

### 4.2 通知中心

#### 4.2.1 入口

- **Admin**: 顶部导航栏右侧铃铛图标
- **Merchant**: 顶部导航栏右侧铃铛图标
- **Distributor**: 顶部导航栏右侧铃铛图标

#### 4.2.2 NotificationBell 组件

```
[🔔 Badge(未读数)] → 点击 → NotificationDropdown
```

- 未读数 > 99 显示 "99+"
- 点击铃铛展开下拉菜单

#### 4.2.3 NotificationDropdown

- 最近 5 条通知
- 每条显示：类型图标 + 标题 + 时间
- "查看全部" 链接到通知列表页

#### 4.2.4 通知列表页

**路径**: `/[portal]/notifications`

- Tab: 全部 / 未读
- 列表项：类型图标 + 标题 + 内容摘要 + 时间 + 已读/未读状态
- 左滑/长按标记已读

#### 4.2.5 通知偏好设置页

**路径**: `/[portal]/notifications/preferences`

- 按通知类型分组
- 每种类型：站内信开关 + 邮件开关

### 4.3 Webhook 配置页面

**路径**: `/admin/settings/webhooks`

**Webhook 列表**:
| 列 | 描述 |
|----|------|
| 名称 | name |
| URL | url（脱敏显示） |
| 事件 | events 数量 + 预览 |
| 状态 | active 开关 |
| 操作 | 编辑 / 删除 / 测试 |

**创建/编辑表单**:
- 名称（Input）
- URL（Input，URL 格式校验）
- 订阅事件（多选 Checkbox）
- 密钥（自动生成，支持手动覆盖）

**测试**:
- 选择一个已订阅的事件发送测试
- 显示投递状态和响应

---

## 5. 触发机制

在关键业务操作处统一调用：

```typescript
// 在 MerchantService.approve() 中示例
async approve(id: string, dto: ApproveMerchantDto, user: JwtPayload) {
  const merchant = await this.prisma.merchant.update({
    where: { id },
    data: { status: 'APPROVED' }
  });

  // 审计日志（异步队列）
  await this.auditService.log({
    actorId: user.sub,
    actorType: 'platform_user',
    actorName: user.name,
    action: 'merchant.approve',
    resource: 'Merchant',
    resourceId: merchant.id,
    payload: { before: { status: 'UNDER_REVIEW' }, after: { status: 'APPROVED' }, reason: dto.reason }
  });

  // 站内通知（异步队列）
  await this.notificationService.send({
    userId: merchant.userId,
    userType: 'user',
    type: 'merchant.approved',
    title: '商户审批通过',
    content: `您的商户申请已通过审批`,
    data: { link: `/merchant/profile` }
  });

  // Webhook（异步队列）
  await this.webhookService.dispatch('merchant.approved', {
    merchantId: merchant.id,
    merchantName: merchant.name,
    approvedAt: new Date().toISOString()
  });
}
```

---

## 6. 共享类型

### 6.1 事件类型枚举

```typescript
// packages/shared/src/events/audit.actions.ts
export const AuditActions = {
  // 商户
  MERCHANT_APPROVE: 'merchant.approve',
  MERCHANT_REJECT: 'merchant.reject',
  MERCHANT_CREATE: 'merchant.create',
  // 佣金
  COMMISSION_SETTLE: 'commission.settle',
  // 提现
  WITHDRAWAL_APPROVE: 'withdrawal.approve',
  WITHDRAWAL_REJECT: 'withdrawal.reject',
  // 订单
  ORDER_SHIP: 'order.ship',
  ORDER_VERIFY_PICKUP: 'order.verify_pickup',
  ORDER_PAID: 'order.paid',
  // 配额
  ALLOCATION_CREATE: 'allocation.create',
  // 资金
  FUND_ADJUST: 'fund.adjust',
  // 补货
  REPLENISHMENT_APPROVE: 'replenishment.approve',
  REPLENISHMENT_REJECT: 'replenishment.reject',
} as const;

export type AuditAction = typeof AuditActions[keyof typeof AuditActions];

// packages/shared/src/events/notification.types.ts
export const NotificationTypes = {
  MERCHANT_APPROVED: 'merchant.approved',
  MERCHANT_REJECTED: 'merchant.rejected',
  COMMISSION_SETTLED: 'commission.settled',
  WITHDRAWAL_APPROVED: 'withdrawal.approved',
  WITHDRAWAL_REJECTED: 'withdrawal.rejected',
  ORDER_PAID: 'order.paid',
  ORDER_SHIPPED: 'order.shipped',
  ORDER_PICKED_UP: 'order.picked_up',
  REPLENISHMENT_APPROVED: 'replenishment.approved',
  REPLENISHMENT_REJECTED: 'replenishment.rejected',
} as const;

export type NotificationType = typeof NotificationTypes[keyof typeof NotificationTypes];

// packages/shared/src/events/webhook.events.ts
// 与 NotificationTypes 共用
export { NotificationTypes as WebhookEvents };
```

### 6.2 导出

```typescript
// packages/shared/src/index.ts 新增
export * from './events/audit.actions';
export * from './events/notification.types';
export * from './events/webhook.events';
```

---

## 7. 实施计划

### Phase 1: 审计日志
1. [ ] 创建 Prisma Migration 添加 `AuditLog` Model
2. [ ] 创建 `AuditModule`（module, controller, service, processor）
3. [ ] 创建 API 端点 `/platform/audit-logs`
4. [ ] 在现有服务中注入审计日志调用（merchant, commission, withdrawal, order, allocation, fund, replenishment）
5. [ ] Admin UI 审计日志页面

### Phase 2: 通知中心
1. [ ] 创建 Prisma Migration 添加 `Notification`, `NotificationPreference` Model
2. [ ] 创建 `NotificationModule`
3. [ ] 创建 API 端点（通知 CRUD + 偏好设置）
4. [ ] 前端 NotificationBell + Dropdown 组件
5. [ ] 前端通知列表页和偏好设置页

### Phase 3: Webhook
1. [ ] 创建 Prisma Migration 添加 `WebhookConfig`, `WebhookDelivery` Model
2. [ ] 创建 `WebhookModule`
3. [ ] 创建 API 端点（Webhook CRUD + 投递记录）
4. [ ] 实现 HMAC 签名和投递逻辑
5. [ ] Admin UI Webhook 配置页面

---

## 8. 测试策略

### 8.1 单元测试
- `AuditService.log()` — 验证日志写入队列
- `NotificationService.send()` — 验证通知创建和邮件投递
- `WebhookService.dispatch()` — 验证 HMAC 签名

### 8.2 API 集成测试
- 审批操作触发审计日志
- 通知偏好设置正确过滤
- Webhook 投递重试机制

### 8.3 E2E 测试
- Admin 审计日志页面筛选和导出
- 商户收到通知并标记已读
- Webhook 配置 CRUD

---

## 9. 开放问题

| 问题 | 状态 | 备注 |
|------|------|------|
| 审计日志保留期限 | 待定 | 建议保留 1 年，按月分区 |
| 通知邮件频率限制 | 待定 | 防止邮件轰炸 |
| Webhook 投递延迟容忍度 | 待定 | 当前设计异步，最长延迟 ~5min |

---

## 10. 相关文档

| 文档 | 路径 |
|------|------|
| 架构设计 | `docs/architecture/phase-5-distribution-and-allocation.md` |
| NestJS 模式 | `.cursor/rules/backend.mdc` |
| 前端组件规范 | `.cursor/rules/ui.mdc` |
