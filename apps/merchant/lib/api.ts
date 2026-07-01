/**
 * 商户门户 API 客户端
 *
 * 模块说明:
 * - 封装所有与商户 API 交互的函数
 * - 使用 JWT Bearer Token 进行身份认证
 * - 所有请求默认不缓存，确保数据实时性
 *
 * 认证机制:
 * - 使用 merchant_token 作为认证 Cookie
 * - 请求头 Authorization: Bearer <token>
 * - 商户用户 JWT 使用 JWT_MERCHANT_SECRET 签名
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
 * 辅助函数:
 * - asList: 兼容 PaginatedResponse 和数组两种响应格式
 * - asListTotal: 获取列表总条数
 *
 * 关键类型定义:
 * - OnboardingProfile: 商户基本资料
 * - Contact: CRM 联系人
 * - Company: CRM 公司
 * - Lead: 销售线索
 * - Distributor: 经销商绑定信息
 * - Binding: 绑定关系
 * - MerchantDashboard: 商户仪表盘数据
 * - Category: 商品分类
 * - Product/ProductVariant: 商品和变体
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/** 商户门户认证 Cookie 名称 */
export const AUTH_COOKIE = 'merchant_token';

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

/**
 * 兼容处理列表响应
 *
 * @param response - API 响应（PaginatedResponse 或 数组）
 * @returns 统一返回数组格式
 *
 * 使用场景:
 * - 有些 API 返回 PaginatedResponse，有些直接返回数组
 * - 此函数统一处理，避免调用方做类型判断
 */
export function asList<T>(response: PaginatedResponse<T> | T[] | null | undefined): T[] {
  if (Array.isArray(response)) return response;
  if (response && Array.isArray(response.data)) return response.data;
  return [];
}

/**
 * 获取列表总条数
 *
 * @param response - API 响应（PaginatedResponse 或 数组）
 * @returns 总记录数
 */
export function asListTotal<T>(response: PaginatedResponse<T> | T[] | null | undefined): number {
  if (Array.isArray(response)) return response.length;
  if (response?.meta?.total != null) return response.meta.total;
  return asList(response).length;
}

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
 * 商户入驻资料
 *
 * @property businessName - 企业名称
 * @property legalName - 法人名称
 * @property contactEmail - 联系邮箱
 * @property contactPhone - 联系电话
 * @property onboardingStatus - 入驻状态
 */
export interface OnboardingProfile {
  businessName: string;
  legalName?: string;
  contactEmail: string;
  contactPhone?: string;
  onboardingStatus: string;
}

/**
 * CRM 联系人
 *
 * @property id - 联系人唯一标识
 * @property firstName - 名
 * @property lastName - 姓
 * @property email - 邮箱
 * @property phone - 电话
 * @property companyId - 所属公司 ID
 * @property company - 所属公司信息
 */
export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  companyId?: string;
  company?: { name: string };
}

/**
 * CRM 公司
 *
 * @property id - 公司唯一标识
 * @property name - 公司名称
 * @property website - 网站
 * @property _count - 关联联系人数量
 */
export interface Company {
  id: string;
  name: string;
  website?: string;
  _count?: { contacts: number };
}

/**
 * 销售线索
 *
 * @property id - 线索唯一标识
 * @property title - 线索标题
 * @property stage - 线索阶段（NEW/QUALIFIED/WON/LOST）
 * @property source - 来源渠道
 * @property contact - 关联联系人
 * @property distributor - 关联经销商
 * @property updatedAt - 更新时间
 */
export interface Lead {
  id: string;
  title: string;
  stage: string;
  source?: string;
  contact?: { firstName: string; lastName: string };
  distributor?: { name: string };
  updatedAt: string;
}

/**
 * 经销商绑定信息
 *
 * @property id - 绑定唯一标识
 * @property name - 经销商名称
 * @property email - 邮箱
 * @property phone - 电话
 * @property commissionRate - 佣金率
 * @property commissionType - 佣金类型
 * @property isActive - 是否活跃
 * @property portalEnabled - 门户是否启用
 * @property lastLoginAt - 最后登录时间
 * @property _count - 关联绑定数量
 */
export interface Distributor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  commissionRate: string | number;
  commissionType: string;
  isActive: boolean;
  portalEnabled?: boolean;
  lastLoginAt?: string | null;
  _count?: { bindings: number };
}

import type { BindVerifyResponse, GenerateQrResponse } from '@meridian/shared';

export type { BindVerifyResponse, GenerateQrResponse };

/**
 * 绑定关系
 *
 * @property id - 绑定唯一标识
 * @property bindableType - 绑定类型
 * @property boundAt - 绑定时间
 * @property lead - 关联线索
 */
export interface Binding {
  id: string;
  bindableType: string;
  boundAt: string;
  lead?: { title: string };
}

/**
 * 商户仪表盘数据
 *
 * @property businessName - 商户名称
 * @property contactsCount - 联系人总数
 * @property openLeads - 打开的线索数
 * @property activeDistributors - 活跃经销商数
 * @property recentBindings - 近期绑定数
 * @property recentLeads - 最近线索列表
 */
export interface MerchantDashboard {
  businessName: string;
  contactsCount: number;
  openLeads: number;
  activeDistributors: number;
  recentBindings: number;
  recentLeads: Lead[];
}

/**
 * 商品分类
 *
 * @property id - 分类唯一标识
 * @property name - 分类名称
 * @property slug - URL slug
 * @property parentId - 父分类 ID
 * @property parent - 父分类信息
 * @property _count - 商品数量
 */
export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  parent?: { name: string };
  _count?: { products: number };
}

/**
 * 商品变体
 *
 * @property id - 变体唯一标识
 * @property sku - SKU 代码
 * @property name - 变体名称（如颜色、尺寸）
 * @property price - 售价
 * @property inventory - 库存数量
 * @property isActive - 是否上架
 */
export interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  price: string | number;
  inventory: number;
  isActive: boolean;
}

/**
 * 商品
 *
 * @property id - 商品唯一标识
 * @property name - 商品名称
 * @property slug - URL slug
 * @property description - 商品描述
 * @property isPublished - 是否发布
 * @property categoryId - 分类 ID
 * @property category - 分类信息
 * @property variants - 变体列表
 */
export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isPublished: boolean;
  categoryId?: string;
  category?: { id: string; name: string };
  variants: ProductVariant[];
}
