import { ApiError, asList, asListTotal } from '@meridian/shared';

export { ApiError, asList, asListTotal };

export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number };
}

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
export const AUTH_COOKIE = 'merchant_token';

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
