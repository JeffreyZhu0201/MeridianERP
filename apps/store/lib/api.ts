import {
  ApiError,
  CART_SESSION_HEADER,
  type BindVerifyResponse,
  type PublishedStoreListResponse,
  type StoreClaimBindingResponse,
} from '@meridian/shared';

export type { BindVerifyResponse, PublishedStoreListResponse, StoreClaimBindingResponse };
export { ApiError };

import { ensureCartSessionId } from './cart-session.client';

export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number };
}

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
export const STORE_APP_URL = process.env.STORE_APP_URL ?? 'http://localhost:3003';
export const AUTH_COOKIE = 'store_token';

export type StoreApiAuth =
  | string
  | {
      token?: string;
      storeSlug?: string;
      cartSession?: string;
    };

/**
 * 通用 API 请求函数
 *
 * @param path - API 路径（不含 /api/v1 前缀）
 * @param options - fetch 选项（method, body, headers 等）
 * @param auth - 认证参数（token 字符串或包含认证信息的对象）
 * @returns 解析后的 JSON 响应数据
 *
 * 认证优先级:
 * 1. token（已登录用户）
 * 2. cartSession（会话 ID，非登录用户）
 * 3. storeSlug（匿名用户，自动生成本地会话）
 *
 * 请求特性:
 * - 自动添加 Content-Type: application/json
 * - 根据 auth 参数自动选择认证方式
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
  auth?: StoreApiAuth,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  let token: string | undefined;
  let cartSession: string | undefined;
  let storeSlug: string | undefined;

  if (typeof auth === 'string') {
    token = auth;
  } else if (auth) {
    token = auth.token;
    cartSession = auth.cartSession;
    storeSlug = auth.storeSlug;
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else if (cartSession) {
    headers[CART_SESSION_HEADER] = cartSession;
  } else if (storeSlug && typeof window !== 'undefined') {
    headers[CART_SESSION_HEADER] = ensureCartSessionId(storeSlug);
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
 * 生成商店相关路径
 *
 * @param slug - 商店 slug
 * @param path - 路径（可选，默认返回商店首页路径）
 * @returns 完整的商店相对路径
 *
 * 示例:
 * - storePath('demo') → '/store/demo'
 * - storePath('demo', '/products') → '/store/demo/products'
 * - storePath('demo', 'cart') → '/store/demo/cart'
 */
export function storePath(slug: string, path = ''): string {
  if (!path) return `/store/${slug}`;
  return `/store/${slug}${path.startsWith('/') ? path : `/${path}`}`;
}


/**
 * 认证响应结构
 *
 * @property accessToken - JWT 访问令牌
 * @property customer - 客户信息
 */
export interface AuthResponse {
  accessToken: string;
  customer: { id: string; email: string };
}

/**
 * 商店信息
 *
 * @property slug - 商店唯一标识
 * @property businessName - 商店企业名称
 */
export interface StoreInfo {
  slug: string;
  businessName: string;
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
 * @property variants - 变体列表
 * @property category - 分类信息
 */
export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isPublished: boolean;
  variants: ProductVariant[];
  category?: { id: string; name: string };
}

/**
 * 购物车商品项
 *
 * @property id - 购物车条目唯一标识
 * @property quantity - 购买数量
 * @property variant - 商品变体信息（含价格和所属商品）
 */
export interface CartItem {
  id: string;
  quantity: number;
  variant: {
    id: string;
    name: string;
    price: string | number;
    product: { name: string; slug: string };
  };
}

/**
 * 购物车
 *
 * @property id - 购物车唯一标识
 * @property items - 购物车商品列表
 * @property subtotal - 购物车小计金额
 */
export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: string | number;
}

