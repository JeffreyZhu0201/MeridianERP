/**
 * 商户端库存 API 辅助：查询串构建与 CSV 导出下载。
 */
import type { StockAdjustmentReason, PurchaseOrderStatus } from '@meridian/shared';

import { API_URL, type PaginatedResponse } from './api';

/** 库存列表 API 分页结构（与 Nest 控制器一致：data + meta） */
export type InventoryPaginated<T> = PaginatedResponse<T>;

/** API 失败时的空分页占位，保持泛型一致 */
export function emptyInventoryPage<T>(limit = 20): InventoryPaginated<T> {
  return { data: [], meta: { total: 0, page: 1, limit } };
}

/** 将 API 分页响应规范为页面组件使用的 items/total */
export function normalizeInventoryPage<T>(
  res: InventoryPaginated<T> | null | undefined,
) {
  return {
    items: res?.data ?? [],
    total: res?.meta?.total ?? 0,
    page: res?.meta?.page ?? 1,
    limit: res?.meta?.limit ?? 20,
  };
}

/** 将筛选参数序列化为 API 查询字符串 */
export function buildInventoryQuery(
  params: Record<string, string | number | undefined>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

/** 带鉴权下载库存报表 CSV 并触发浏览器保存 */
export async function downloadInventoryExport(
  path: string,
  token: string,
  filename: string,
): Promise<void> {
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message ?? '导出失败');
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export { StockAdjustmentReason, PurchaseOrderStatus };
