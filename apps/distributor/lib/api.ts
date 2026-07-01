/**
 * 经销商门户 API 客户端
 *
 * 模块说明:
 * - 封装所有与经销商 API 交互的函数
 * - 使用 JWT Bearer Token 进行身份认证
 * - 所有请求默认不缓存，确保数据实时性
 *
 * 认证机制:
 * - 使用 distributor_token 作为认证 Cookie
 * - 请求头 Authorization: Bearer <token>
 * - 经销商用户 JWT 使用 JWT_DISTRIBUTOR_SECRET 签名
 *
 * API 基础配置:
 * - 基础 URL: NEXT_PUBLIC_API_URL 环境变量，默认为 http://localhost:3001
 * - API 版本前缀: /api/v1
 * - Content-Type: application/json
 *
 * 错误处理:
 * - ApiError 类封装 HTTP 状态码和错误消息
 * - 非 2xx 响应自动抛出 ApiError
 *
 * 关键类型定义（从 @meridian/shared 导入）:
 * - DistributorLoginResponse: 经销商登录响应
 * - DistributorDashboard: 经销商仪表盘数据
 * - DistributorCommissionListResponse: 佣金列表响应
 * - DistributorBindingsResponse: 绑定列表响应
 * - DistributorBranchSummary: 分店摘要信息
 * - WithdrawalRequestRow: 提现申请行
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/** 经销商门户认证 Cookie 名称 */
export const AUTH_COOKIE = 'distributor_token';

/**
 * API 错误类
 *
 * @property status - HTTP 状态码
 * @property message - 错误消息（通常来自 API 响应 body.message）
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

  return res.json() as Promise<T>;
}

export type {
  DistributorLoginResponse,
  DistributorDashboard,
  DistributorCommissionListResponse,
  DistributorBindingsResponse,
  DistributorBranchSummary,
  WithdrawalRequestRow,
} from '@meridian/shared';
