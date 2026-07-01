import type { CommissionType, LedgerStatus } from './enums.js';

/**
 * Phase 5 渠道分销相关类型定义
 * 涵盖履约类型、经销商管理、提现等功能
 */

/**
 * 履约类型枚举
 * 订单商品/服务的交付方式
 * - PICKUP: 消费者到店自提
 * - DELIVERY: 商家配送到消费者地址
 */
export type FulfillmentType = 'PICKUP' | 'DELIVERY';

/**
 * 配额分配单状态枚举
 * - DRAFT: 草稿态，平台尚未正式发布
 * - ISSUED: 已发布，等待商户确认
 * - CONFIRMED: 已确认，商户已接受配额
 * - CANCELLED: 已取消
 */
export type AllocationOrderStatus = 'DRAFT' | 'ISSUED' | 'CONFIRMED' | 'CANCELLED';

/**
 * 补货请求状态枚举
 * - PENDING: 待处理，平台尚未审核
 * - APPROVED: 已批准，可进行配货
 * - REJECTED: 已拒绝
 * - FULFILLED: 已完成发货
 */
export type ReplenishmentRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'FULFILLED';

/**
 * 提现请求状态枚举
 * - PENDING: 待处理，平台尚未审核
 * - APPROVED: 已批准，款项已打款
 * - REJECTED: 已拒绝
 */
export type WithdrawalRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/**
 * 平台经销商摘要
 * 平台管理员查看经销商信息的简化结构
 * @property id - 经销商ID
 * @property name - 经销商名称
 * @property email - 经销商邮箱
 * @property phone - 经销商电话
 * @property commissionRate - 佣金率或固定金额
 * @property commissionType - 佣金计算方式
 * @property isActive - 账号是否启用
 * @property portalEnabled - 是否已开通门户
 * @property recruitedMerchantCount - 已招募商户数量
 * @property createdAt - 创建时间
 */
export interface PlatformDistributorSummary {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  commissionRate: string | number;
  commissionType: CommissionType;
  isActive: boolean;
  portalEnabled: boolean;
  recruitedMerchantCount: number;
  createdAt: string;
}

/**
 * 创建平台经销商请求
 * @property name - 经销商名称（必填）
 * @property email - 邮箱（可选）
 * @property phone - 电话（可选）
 * @property commissionRate - 佣金率（必填）
 * @property commissionType - 佣金计算方式（可选，默认 PERCENT）
 */
export interface CreatePlatformDistributorRequest {
  name: string;
  email?: string;
  phone?: string;
  commissionRate: number;
  commissionType?: CommissionType;
}

/**
 * 更新平台经销商请求
 * @property name - 名称（可选）
 * @property email - 邮箱（可选）
 * @property phone - 电话（可选）
 * @property commissionRate - 佣金率（可选）
 * @property commissionType - 佣金计算方式（可选）
 * @property isActive - 是否启用（可选）
 */
export interface UpdatePlatformDistributorRequest {
  name?: string;
  email?: string;
  phone?: string;
  commissionRate?: number;
  commissionType?: CommissionType;
  isActive?: boolean;
}

/**
 * 商户招募邀请码响应
 * 经销商生成邀请码供商户注册时使用
 * @property id - 邀请码记录ID
 * @property code - 邀请码
 * @property distributorId - 所属经销商ID
 * @property expiresAt - 过期时间（null 表示永不过期）
 * @property revokedAt - 撤销时间（null 表示未撤销）
 * @property useCount - 已使用次数
 * @property url - 完整的邀请注册 URL
 */
export interface MerchantRecruitInviteCodeResponse {
  id: string;
  code: string;
  distributorId: string;
  expiresAt: string | null;
  revokedAt: string | null;
  useCount: number;
  url: string;
}

/**
 * 批准商户入驻请求
 * @property recruitedByDistributorId - 招募方经销商ID（可选，用于关联招募关系）
 */
export interface ApproveMerchantRequest {
  recruitedByDistributorId?: string;
}

/**
 * 经销商分店摘要
 * 经销商查看其招募的商户（分店）信息
 * @property tenantId - 商户租户ID
 * @property merchantProfileId - 商户档案ID
 * @property businessName - 商户企业名称
 * @property slug - 商户商店 URL slug
 * @property recruitedAt - 招募时间
 * @property salesLast30Days - 近30天销售额
 * @property orderCountLast30Days - 近30天订单数
 */
export interface DistributorBranchSummary {
  tenantId: string;
  merchantProfileId: string;
  businessName: string;
  slug: string;
  recruitedAt: string | null;
  salesLast30Days: string | number;
  orderCountLast30Days: number;
}

/**
 * 提现请求行
 * 经销商发起的佣金提现申请
 * @property id - 提现记录ID
 * @property distributorId - 申请人经销商ID
 * @property distributorName - 申请人名称
 * @property amount - 提现金额
 * @property status - 当前状态
 * @property note - 申请人备注
 * @property rejectionReason - 拒绝原因（如被拒绝）
 * @property reviewedAt - 审核时间
 * @property createdAt - 申请时间
 */
export interface WithdrawalRequestRow {
  id: string;
  distributorId: string;
  distributorName: string;
  amount: string | number;
  status: WithdrawalRequestStatus;
  note: string | null;
  rejectionReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

/**
 * 创建提现请求
 * @property amount - 提现金额（必填，需 <= 可用余额）
 * @property note - 备注说明（可选）
 */
export interface CreateWithdrawalRequest {
  amount: number;
  note?: string;
}

/**
 * 经销商资金汇总
 * 经销商查看自己的资金状况
 * @property accruedTotal - 应计佣金总额（已记账但未结算）
 * @property settledTotal - 已结算佣金总额（已支付）
 * @property pendingWithdrawals - 待处理提现金额
 * @property availableBalance - 可提现余额
 * @property branchCount - 招募分店数量
 */
export interface DistributorFundsSummary {
  accruedTotal: string | number;
  settledTotal: string | number;
  pendingWithdrawals: string | number;
  availableBalance: string | number;
  branchCount: number;
}
