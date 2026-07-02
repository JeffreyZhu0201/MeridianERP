/**
 * 配额分配管理页面
 *
 * 功能说明:
 * - 平台总部向各商户分配主 SKU 配额的核心管理页面
 * - 展示所有主 SKU（Master SKU）的库存和配额信息
 * - 支持创建、编辑配额分配单（Allocation Order）
 * - 查看各商户的配额分配历史和当前配额使用情况
 *
 * 使用场景:
 * - 平台运营人员根据商户需求分配 SKU 配额
 * - 监控各主 SKU 的在库数量和配额余量
 * - 处理商户的配额申请和调整
 *
 * 数据来源:
 * - 主 SKU 列表: /platform/allocations/master-skus API
 * - 配额分配单: /platform/allocations API
 * - 已批准商户: /platform/merchants?status=APPROVED API
 * - 使用 admin.allocations i18n 命名空间
 */
import { getLocale, getTranslations } from 'next-intl/server';
import { BentoListHeader, ListPageFrame, formatMoney } from '@meridian/ui';
import { OnboardingStatus } from '@meridian/shared';

import { AdminShellWrapper } from '@/components/admin-shell-wrapper';
import {
  apiFetch,
  type AllocationOrder,
  type MasterSku,
  type MerchantListItem,
  type PaginatedResponse,
} from '@/lib/api';
import { getToken } from '@/lib/auth';
import { AllocationsView } from './_components/allocations-view';

/**
 * 配额分配页面主组件
 *
 * 页面布局:
 * - AdminShellWrapper: 管理门户框架
 * - BentoListHeader: 顶部指标卡片区域
 * - ListPageFrame: 列表页面框架
 *
 * 核心数据模型:
 * 1. MasterSku（主 SKU）
 *    - 平台总部定义的核心商品 SKU
 *    - 包含: id, name, sku, quantityOnHand（在库数量）, wholesalePrice（批发价）
 *
 * 2. AllocationOrder（配额分配单）
 *    - 记录向商户分配配额的订单
 *    - 状态包括: DRAFT（草稿）, PUBLISHED（已发布）, ALLOCATED（已分配）
 *
 * 3. MerchantListItem（商户列表项）
 *    - 已批准入驻的商户信息
 *    - 用于下拉选择分配对象
 *
 * 核心功能:
 * 1. 指标卡片
 *    - masterSkus: 主 SKU 总数
 *    - allocationOrders: 配额分配单总数
 *    - draftCount: 草稿状态的分配单数量
 *    - skuColumns.onHand: 所有 SKU 在库总量及价值
 *
 * 2. AllocationsView 子组件
 *    - 接收 masterSkus、allocations、merchants 数据
 *    - 渲染配额分配表格和操作界面
 *    - 支持创建新分配单、编辑现有分配单
 *
 * 数据获取策略:
 * - 使用 Promise.all 并行加载三个 API:
 *   1. 主 SKU 列表
 *   2. 配额分配单列表
 *   3. 已批准商户列表（分页 limit=100 获取所有）
 * - 任意 API 失败不影响其他数据加载
 */
export default async function AllocationsPage() {
  const token = await getToken();
  if (!token) return null;

  const locale = await getLocale();
  const t = await getTranslations('admin.allocations');

  const [masterSkusRes, allocations, merchantsRes] = await Promise.all([
    apiFetch<{ data: MasterSku[] }>('/platform/allocations/master-skus', {}, token).catch(
      () => ({ data: [] }),
    ),
    apiFetch<AllocationOrder[]>('/platform/allocations', {}, token).catch(() => []),
    apiFetch<PaginatedResponse<MerchantListItem>>(
      `/platform/merchants?status=${OnboardingStatus.APPROVED}&limit=100`,
      {},
      token,
    ).catch(() => ({ data: [], meta: { total: 0, page: 1, limit: 100 } })),
  ]);

  const masterSkus = masterSkusRes.data ?? [];

  const approvedMerchants = merchantsRes.data
    .map((m) => {
      const row = m as MerchantListItem & { tenantId?: string };
      return row.tenantId
        ? { id: row.id, businessName: row.businessName, tenantId: row.tenantId }
        : null;
    })
    .filter((m): m is { id: string; businessName: string; tenantId: string } => m !== null);

  const draftCount = allocations.filter((a) => a.status === 'DRAFT').length;

  const metrics: Array<{ title: string; value: number | string; description?: string }> = [
    { title: t('masterSkus'), value: masterSkus.length },
    { title: t('allocationOrders'), value: allocations.length },
    { title: 'Draft', value: draftCount },
  ];

  if (masterSkus.length > 0) {
    const onHand = masterSkus.reduce((sum, sku) => sum + sku.quantityOnHand, 0);
    metrics.push({
      title: t('skuColumns.onHand'),
      value: onHand,
      description: formatMoney(
        masterSkus.reduce((sum, sku) => sum + Number(sku.wholesalePrice) * sku.quantityOnHand, 0),
      ),
    });
  }

  return (
    <AdminShellWrapper>
      <div className="space-y-6">
        <BentoListHeader metrics={metrics} />
        <ListPageFrame title={t('title')} description={t('description')}>
          <AllocationsView
            masterSkus={masterSkus}
            allocations={allocations}
            merchants={approvedMerchants}
            token={token}
          />
        </ListPageFrame>
      </div>
    </AdminShellWrapper>
  );
}
