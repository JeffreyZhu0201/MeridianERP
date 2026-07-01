/**
 * 管理门户 API 客户端
 *
 * 模块说明:
 * - 封装所有与平台 API 交互的函数
 * - 使用 JWT Bearer Token 进行身份认证
 * - 所有请求默认不缓存，确保数据实时性
 *
 * 认证机制:
 * - 使用 admin_token 作为认证 Cookie
 * - 请求头 Authorization: Bearer <token>
 * - 平台管理员 JWT 使用 JWT_SECRET 签名
 *
 * API 基础配置:
 * - 基础 URL: NEXT_PUBLIC_API_URL 环境变量，默认为 http://localhost:3001
 * - API 版本前缀: /api/v1
 * - Content-Type: application/json
 *
 * 错误处理:
 * - ApiError 类封装 HTTP 状态码和错误消息
 * - 非 2xx 响应自动抛出 ApiError
 * - 204 No Content 返回 undefined
 *
 * 关键类型定义:
 * - DashboardStats: 平台仪表盘统计数据
 * - MerchantListItem: 商户列表项
 * - MerchantDetail: 商户详情（含 CRM 和经销商信息）
 * - PlatformOrder: 平台订单
 * - PlatformDistributor: 平台经销商
 * - FundsSummary: 资金汇总
 * - AllocationOrder: 配额分配单
 * - WithdrawalRequest: 提现申请
 * - CommissionLedgerEntry: 佣金账本条目
 * - SettlementBatch: 结算批次
 */
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

/** API 服务器基础地址 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/** 管理门户认证 Cookie 名称 */
export const AUTH_COOKIE = 'admin_token';

/**
 * API 错误类
 *
 * @property status - HTTP 状态码
 * @property message - 错误消息（通常来自 API 响应 body.message）
 *
 * 使用场景:
 * - API 调用失败时抛出
 * - 区分不同类型的错误（400, 401, 403, 404, 500 等）
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/**
 * 通用 API 请求函数
 *
 * @param path - API 路径（不含 /api/v1 前缀）
 * @param options - fetch 选项（method, body, headers 等）
 * @param token - JWT 认证令牌（可选，有则添加到 Authorization 头）
 * @returns 解析后的 JSON 响应数据
 *
 * 请求特性:
 * - 自动添加 Content-Type: application/json
 * - 自动添加 Authorization 头（如果提供 token）
 * - 默认 cache: no-store（不缓存）
 *
 * 错误处理:
 * - 非 ok 响应抛出 ApiError
 * - 尝试解析 JSON 错误体，失败时使用 statusText
 * - 204 响应返回 undefined
 */
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

/**
 * 分页响应数据结构
 *
 * @property data - 当前页的数据数组
 * @property meta - 分页元信息
 *   - total: 总记录数
 *   - page: 当前页码
 *   - limit: 每页条数
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number };
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
