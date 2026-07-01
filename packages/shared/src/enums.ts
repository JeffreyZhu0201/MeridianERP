/**
 * 枚举类型定义
 * 本文件包含系统中所有业务枚举类型，用于状态流转、角色管理和数据分类
 */

/**
 * 商户入驻状态枚举
 * 描述商户从创建到审批完成的完整流程状态
 * - DRAFT: 草稿态，商户信息未提交
 * - SUBMITTED: 已提交，等待平台审核
 * - UNDER_REVIEW: 审核中，平台正在审批
 * - APPROVED: 已通过，商户外态已激活
 * - REJECTED: 已拒绝，需要重新修改后提交
 */
export enum OnboardingStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

/**
 * 线索阶段枚举
 * 描述销售线索从获取到成交的转化漏斗状态
 * - NEW: 新线索刚录入
 * - QUALIFIED: 已验证合格，有意向客户
 * - WON: 成交成功
 * - LOST: 流失，已明确拒绝或长期无响应
 */
export enum LeadStage {
  NEW = 'NEW',
  QUALIFIED = 'QUALIFIED',
  WON = 'WON',
  LOST = 'LOST',
}

/**
 * CRM 活动类型枚举
 * 记录与客户/线索交互的业务活动类型
 * - CALL: 电话沟通记录
 * - NOTE: 文字备注说明
 * - MEETING: 线下会议纪要
 */
export enum ActivityType {
  CALL = 'CALL',
  NOTE = 'NOTE',
  MEETING = 'MEETING',
}

/**
 * 佣金计算方式枚举
 * 定义向经销商支付佣金的两种计算模式
 * - PERCENT: 按订单金额百分比计算
 * - FIXED: 按固定金额计算（每单固定数额）
 */
export enum CommissionType {
  PERCENT = 'PERCENT',
  FIXED = 'FIXED',
}

/**
 * 绑定类型枚举
 * 区分经销商与商户/消费者的绑定关系
 * - MERCHANT: 经销商绑定商户（招募分店）
 * - CUSTOMER: 经销商绑定消费者（推广客户）
 */
export enum BindType {
  MERCHANT = 'MERCHANT',
  CUSTOMER = 'CUSTOMER',
}

/**
 * 平台超级管理员角色枚举
 * 平台管理员账号的角色层级
 * - SUPER_ADMIN: 超级管理员，拥有全部平台权限
 * - PLATFORM_OPS: 平台运营人员，拥有日常运营权限
 */
export enum PlatformRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  PLATFORM_OPS = 'PLATFORM_OPS',
}

/**
 * 商户内部角色枚举
 * 商户账号的权限角色划分
 * - MERCHANT_OWNER: 商户老板，拥有全部商户权限
 * - MERCHANT_STAFF: 商户员工，仅限日常操作权限
 */
export enum MerchantRole {
  MERCHANT_OWNER = 'MERCHANT_OWNER',
  MERCHANT_STAFF = 'MERCHANT_STAFF',
}

/**
 * 订单状态枚举
 * 描述订单从创建到完结的完整生命周期
 * - PENDING_PAYMENT: 待支付，买家尚未完成付款
 * - PAID: 已支付，款项已收到
 * - FULFILLED: 已履约，商品已交付或服务已完成
 * - CANCELLED: 已取消，订单被撤销
 * - REFUNDED: 已退款，款项已退还买家
 */
export enum OrderStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID = 'PAID',
  FULFILLED = 'FULFILLED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

/**
 * 账本记录状态枚举
 * 佣金账本条目的状态标记
 * - ACCRUED: 应计已记账，订单完成但尚未结算
 * - SETTLED: 已结算，佣金已支付给经销商
 * - VOID: 已作废，记录无效或被撤销
 */
export enum LedgerStatus {
  ACCRUED = 'ACCRUED',
  SETTLED = 'SETTLED',
  VOID = 'VOID',
}

/**
 * 结算批次状态枚举
 * 批量佣金结算的批次处理状态
 * - DRAFT: 草稿态，批次数据待确认
 * - EXPORTED: 已导出，批次数据已导出待支付
 * - PAID: 已支付，批次佣金已全部完成支付
 */
export enum SettlementBatchStatus {
  DRAFT = 'DRAFT',
  EXPORTED = 'EXPORTED',
  PAID = 'PAID',
}

/**
 * 采购订单状态枚举
 * 描述采购订单从创建到收货的流程状态
 * - DRAFT: 草稿态，采购单未正式提交
 * - ORDERED: 已下单，供应商已确认
 * - PARTIALLY_RECEIVED: 部分收货，部分商品已到货
 * - RECEIVED: 完全收货，全部商品已到货
 * - CANCELLED: 已取消，采购单被撤销
 */
export enum PurchaseOrderStatus {
  DRAFT = 'DRAFT',
  ORDERED = 'ORDERED',
  PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED',
  RECEIVED = 'RECEIVED',
  CANCELLED = 'CANCELLED',
}

/**
 * 库存调整原因枚举
 * 记录库存变动的业务原因
 * - DAMAGE: 商品损坏报废
 * - COUNT_CORRECTION: 盘点数量校正
 * - RETURN: 客户退货入库
 * - OTHER: 其他原因
 * - TRANSFER_OUT: 调拨出库
 * - TRANSFER_IN: 调拨入库
 */
export enum StockAdjustmentReason {
  DAMAGE = 'DAMAGE',
  COUNT_CORRECTION = 'COUNT_CORRECTION',
  RETURN = 'RETURN',
  OTHER = 'OTHER',
  TRANSFER_OUT = 'TRANSFER_OUT',
  TRANSFER_IN = 'TRANSFER_IN',
}

/**
 * 库存调拨状态枚举
 * 仓库间调拨业务的执行状态
 * - COMPLETED: 调拨完成，商品已转入目标仓库
 * - CANCELLED: 调拨取消，操作被终止
 */
export enum StockTransferStatus {
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}
