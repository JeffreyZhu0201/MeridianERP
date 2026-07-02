import type {
  DistributorBranchSummary,
  MasterSkuSummary,
  MerchantRecruitInviteCodeResponse,
  PlatformDashboardStats,
  PlatformDistributorSummary,
  PlatformFundsSummary,
  PlatformMerchantDetail,
  PlatformRecentMerchant,
} from '@meridian/shared';
import { ApiError } from '@meridian/shared';

export { ApiError };

export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number };
}

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
export const AUTH_COOKIE = 'admin_token';

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}/api/v1${path}`, {
    ...options,
    headers,
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.message ?? res.statusText);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}


/** 商户列表项 — 与仪表盘最近商户数据结构相同 */
export type MerchantListItem = PlatformRecentMerchant;

/** 平台管理员商户详情（含 CRM 和经销商扩展信息） */
export type MerchantDetail = PlatformMerchantDetail;

/** 平台仪表盘聚合数据 */
export type DashboardStats = PlatformDashboardStats;

/**
 * 认证响应结构
 *
 * @property accessToken - JWT 访问令牌
 * @property user - 用户信息
 */
export interface AuthResponse {
  accessToken: string;
  user: { id: string; email: string; role: string };
}

/**
 * 平台订单数据结构
 *
 * @property id - 订单唯一标识
 * @property status - 订单状态
 * @property fulfillmentType - 履约类型（DELIVERY/PICKUP）
 * @property total - 订单总金额
 * @property currency - 货币类型
 * @property guestEmail - 访客邮箱（如果不是注册用户）
 * @property createdAt - 创建时间
 * @property tenant - 所属商户信息
 * @property distributor - 归因经销商（如果有）
 */
export interface PlatformOrder {
  id: string;
  status: string;
  fulfillmentType?: string;
  total: string | number;
  currency: string;
  guestEmail?: string;
  createdAt: string;
  tenant: { id: string; slug: string; businessName?: string };
  distributor?: { name: string };
}

export type PlatformDistributor = PlatformDistributorSummary;
export type DistributorBranch = DistributorBranchSummary;
export type MasterSku = MasterSkuSummary;
export type FundsSummary = PlatformFundsSummary;
export type RecruitInviteCode = MerchantRecruitInviteCodeResponse;

/**
 * 配额分配单明细行
 *
 * @property id - 明细行唯一标识
 * @property masterSkuId - 主 SKU ID
 * @property quantity - 分配数量
 * @property wholesalePrice - 批发价格
 * @property masterSku - 主 SKU 信息（SKU 代码和名称）
 */
export interface AllocationOrderLine {
  id: string;
  masterSkuId: string;
  quantity: number;
  wholesalePrice: string | number;
  masterSku?: { skuCode: string; name: string };
}

/**
 * 配额分配单
 *
 * @property id - 分配单唯一标识
 * @property tenantId - 目标商户 ID
 * @property status - 状态（DRAFT/PUBLISHED/ALLOCATED）
 * @property note - 备注说明
 * @property issuedAt - 发布时间
 * @property confirmedAt - 确认时间
 * @property createdAt - 创建时间
 * @property tenant - 商户信息
 * @property lines - 分配明细列表
 */
export interface AllocationOrder {
  id: string;
  tenantId: string;
  status: string;
  note?: string | null;
  issuedAt?: string | null;
  confirmedAt?: string | null;
  createdAt: string;
  tenant?: { merchantProfile?: { businessName: string } };
  lines: AllocationOrderLine[];
}

/**
 * 提现申请
 *
 * @property id - 提现申请唯一标识
 * @property distributorId - 经销商 ID
 * @property amount - 提现金额
 * @property status - 状态（PENDING/APPROVED/REJECTED）
 * @property note - 申请备注
 * @property rejectionReason - 拒绝原因
 * @property reviewedAt - 审核时间
 * @property createdAt - 创建时间
 * @property distributor - 经销商信息
 */
export interface WithdrawalRequest {
  id: string;
  distributorId: string;
  amount: string | number;
  status: string;
  note?: string | null;
  rejectionReason?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  distributor: { name: string; email?: string | null };
}

/**
 * 佣金账本条目
 *
 * @property id - 账本条目唯一标识
 * @property amount - 佣金金额
 * @property status - 状态（ACCRUED/SETTLED/VOID）
 * @property createdAt - 创建时间
 * @property distributor - 经销商信息
 * @property order - 关联订单信息
 * @property tenant - 所属商户信息
 */
export interface CommissionLedgerEntry {
  id: string;
  amount: string | number;
  status: string;
  createdAt: string;
  distributor: { name: string };
  order: { id: string; total: string | number };
  tenant: { slug: string };
}

/**
 * 结算批次
 *
 * @property id - 批次唯一标识
 * @property periodStart - 结算周期开始日期
 * @property periodEnd - 结算周期结束日期
 * @property status - 批次状态
 * @property exportedAt - 导出时间
 * @property createdAt - 创建时间
 * @property _count - 关联条目数量
 */
export interface SettlementBatch {
  id: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  exportedAt?: string;
  createdAt: string;
  _count?: { entries: number };
}
