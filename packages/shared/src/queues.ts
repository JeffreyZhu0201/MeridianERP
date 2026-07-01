/**
 * BullMQ 队列相关类型定义
 * 定义邮件发送和佣金计算的异步任务队列
 */

/**
 * 邮件队列名称
 * 用于发送各类业务通知邮件
 */
export const EMAIL_QUEUE = 'email' as const;

/**
 * 佣金队列名称
 * 用于处理订单完成后的佣金计算
 */
export const COMMISSION_QUEUE = 'commission' as const;

/**
 * 邮件队列任务名称枚举
 * 定义所有可通过邮件队列发送的通知类型
 * - merchant.welcome: 商户入驻成功欢迎邮件
 * - merchant.rejected: 商户申请被拒绝通知
 * - distributor.binding.created: 新的绑定关系创建通知
 * - commission.accrued: 佣金到账通知
 * - order.confirmation: 订单确认通知
 */
export const EmailJobName = {
  MERCHANT_WELCOME: 'merchant.welcome',
  MERCHANT_REJECTED: 'merchant.rejected',
  DISTRIBUTOR_BINDING_CREATED: 'distributor.binding.created',
  COMMISSION_ACCRUED: 'commission.accrued',
  ORDER_CONFIRMATION: 'order.confirmation',
} as const;

/**
 * 邮件任务名称类型
 * 从 EmailJobName 枚举推导出的联合类型
 */
export type EmailJobNameValue = (typeof EmailJobName)[keyof typeof EmailJobName];

/**
 * 佣金队列任务名称枚举
 * - order.accrue: 订单完成后计算应计佣金
 */
export const CommissionJobName = {
  ORDER_ACCRUE: 'order.accrue',
} as const;

/**
 * 商户入驻欢迎邮件负载
 * @property email - 收件人邮箱
 * @property businessName - 商户企业名称
 */
export interface MerchantWelcomeEmailPayload {
  email: string;
  businessName: string;
}

/**
 * 商户申请被拒绝邮件负载
 * @property email - 收件人邮箱
 * @property reason - 拒绝原因
 */
export interface MerchantRejectedEmailPayload {
  email: string;
  reason: string;
}

/**
 * 绑定关系创建通知邮件负载
 * @property tenantId - 所属租户ID
 * @property distributorId - 经销商ID
 * @property bindType - 绑定类型
 * @property boundAt - 绑定时间
 */
export interface BindingCreatedEmailPayload {
  tenantId: string;
  distributorId: string;
  bindType: string;
  boundAt: string;
}

/**
 * 佣金到账通知邮件负载
 * @property tenantId - 所属租户ID
 * @property orderId - 来源订单ID
 * @property distributorId - 经销商ID
 * @property amount - 佣金金额
 */
export interface CommissionAccruedEmailPayload {
  tenantId: string;
  orderId: string;
  distributorId: string;
  amount: string;
}

/**
 * 订单确认邮件负载
 * @property tenantId - 所属租户ID
 * @property orderId - 订单ID
 * @property email - 收件人邮箱
 */
export interface OrderConfirmationEmailPayload {
  tenantId: string;
  orderId: string;
  email: string;
}

/**
 * 佣金计算任务负载
 * @property orderId - 订单ID，用于触发佣金计算逻辑
 */
export interface CommissionAccrueJobPayload {
  orderId: string;
}

/**
 * 队列任务默认重试次数
 * 任务失败后自动重试的次数上限
 */
export const DEFAULT_QUEUE_ATTEMPTS = 3;

/**
 * 队列任务默认重试间隔（毫秒）
 * 任务失败后再次尝试的等待时间
 */
export const DEFAULT_QUEUE_BACKOFF_MS = 1000;
