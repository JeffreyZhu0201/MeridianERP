/**
 * 商户补货申请页面
 *
 * 功能说明:
 * - 展示商户向平台提交的补货申请记录
 * - 显示可用配额和主 SKU 信息
 * - 支持创建新的补货申请
 * - 跟踪补货申请的处理状态
 *
 * 使用场景:
 * - 商户根据销售情况向平台申请增加 SKU 配额
 * - 查看历史补货申请的处理进度
 * - 了解当前各 SKU 的可用配额余量
 *
 * 数据来源:
 * - 补货申请列表: /merchant/replenishment API
 * - 主 SKU 列表: /merchant/replenishment/master-skus API
 * - 商户资料: /merchant/onboarding API
 * - 使用 merchant.replenishment i18n 命名空间
 *
 * 补货流程:
 * 1. 商户选择需要补货的 SKU 和数量
 * 2. 提交补货申请（可添加备注说明）
 * 3. 平台管理员审核申请
 * 4. 批准后增加商户的 SKU 配额
 */
import { getTranslations } from 'next-intl/server';
import { ListPageFrame } from '@meridian/ui';
import type { MasterSkuSummary, ReplenishmentRequestSummary } from '@meridian/shared';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { apiFetch, type OnboardingProfile } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { ReplenishmentPanel } from './_components/replenishment-panel';

/**
 * 补货申请列表项类型
 *
 * 扩展自 ReplenishmentRequestSummary，额外包含 lines 字段
 * 用于兼容不同 API 响应格式的数据结构
 */
type ReplenishmentListItem = ReplenishmentRequestSummary & {
  /** 补货商品明细（兼容字段，某些接口可能返回此字段） */
  lines?: unknown[];
};

/**
 * 转换补货申请数据格式
 *
 * @param rows - 原始补货申请列表数据
 * @returns 标准化后的补货申请摘要列表
 *
 * 功能说明:
 * - 统一不同接口返回的数据格式
 * - 确保 lineCount 字段有值（优先使用 lineCount，否则回退到 lines.length）
 *
 * 使用场景:
 * - 将 API 返回的原始数据转换为组件所需格式
 */
function mapRequests(rows: ReplenishmentListItem[]): ReplenishmentRequestSummary[] {
  return rows.map((row) => ({
    id: row.id,
    tenantId: row.tenantId,
    status: row.status,
    note: row.note,
    // 优先使用 lineCount，否则使用 lines 数组长度
    lineCount: row.lineCount ?? row.lines?.length ?? 0,
    createdAt: row.createdAt,
  }));
}

/**
 * 补货申请页面主组件
 *
 * 页面布局:
 * - MerchantShellWrapper: 商户门户框架
 * - ListPageFrame: 列表页面框架
 *
 * 核心功能:
 * 1. 数据并行加载
 *    - requestsRes: 补货申请历史列表
 *    - skus: 主 SKU 列表（用于申请表单）
 *    - profile: 商户基本资料（用于显示商户名称）
 *
 * 2. ReplenishmentPanel 子组件
 *    - 渲染补货申请列表
 *    - 提供创建新申请的表单
 *    - 显示 SKU 配额信息
 *    - 接收 token 用于 API 调用
 *
 * 错误处理:
 * - 任意 API 失败时使用空数组/null 作为降级
 */
export default async function ReplenishmentPage() {
  const t = await getTranslations('merchant.replenishment');
  const token = await getToken();
  if (!token) return null;

  const [requestsRes, skus, profile] = await Promise.all([
    apiFetch<ReplenishmentListItem[]>('/merchant/replenishment', {}, token).catch(() => []),
    apiFetch<MasterSkuSummary[]>('/merchant/replenishment/master-skus', {}, token).catch(() => []),
    apiFetch<OnboardingProfile>('/merchant/onboarding', {}, token).catch(() => null),
  ]);

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      <ListPageFrame title={t('title')} description={t('description')}>
        <ReplenishmentPanel
          requests={mapRequests(requestsRes)}
          skus={skus}
          token={token}
        />
      </ListPageFrame>
    </MerchantShellWrapper>
  );
}
