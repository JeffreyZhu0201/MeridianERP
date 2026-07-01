/**
 * 平台订单管理页面
 *
 * 功能说明:
 * - 展示所有商户的订单列表，支持多维度筛选和查看
 * - 支持按订单状态（已支付、已完成、已退款等）筛选
 * - 支持按履约类型（配送、自提）筛选和切换 Tab
 * - 分页展示订单数据，每页20条
 *
 * 使用场景:
 * - 平台管理员查看全平台订单数据
 * - 监控订单履约状态，处理异常订单
 * - 查看特定状态或类型的订单详情
 *
 * 数据来源:
 * - 订单列表: /platform/orders API（支持分页、状态、履约类型筛选）
 * - 使用 admin.orders i18n 命名空间
 */
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { BentoListHeader, EmptyState, ListPageFrame } from '@meridian/ui';

import { AdminShellWrapper } from '@/components/admin-shell-wrapper';
import { apiFetch, type PaginatedResponse, type PlatformOrder } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { OrdersView } from './_components/orders-view';

/**
 * 页面 Props 类型定义
 *
 * @property searchParams - URL 查询参数，包含:
 *   - page: 当前页码，默认为 "1"
 *   - status: 按订单状态筛选（如 "PAID", "COMPLETED", "REFUNDED"）
 *   - fulfillmentType: 按履约类型筛选（"DELIVERY" 配送 / "PICKUP" 自提）
 *   - tab: 当前激活的 Tab 页（"all" 全部 / "delivery" 仅配送）
 *
 * 说明:
 * - fulfillmentType 和 tab 参数联动，tab=delivery 时自动筛选配送订单
 */
interface OrdersPageProps {
  searchParams: Promise<{ page?: string; status?: string; fulfillmentType?: string; tab?: string }>;
}

/**
 * 订单列表页面主组件
 *
 * 页面布局:
 * - AdminShellWrapper: 管理门户框架
 * - BentoListHeader: 顶部指标区域
 * - ListPageFrame: 列表页面框架
 *
 * 核心功能:
 * 1. 订单筛选
 *    - 状态筛选: 通过 URL 参数 status 传递给 API
 *    - 履约类型筛选: 通过 fulfillmentType 参数筛选
 *    - Tab 切换: 支持 "全部" 和 "仅配送" 两个 Tab
 *
 * 2. 订单视图组件 (OrdersView)
 *    - 负责渲染订单表格和交互逻辑
 *    - 接收 orders 数组、token 和当前激活的 tab
 *    - 支持订单详情查看、状态更新等操作
 *
 * 3. 指标卡片
 *    - 标题根据当前 tab 显示 "全部订单" 或 "配送订单"
 *    - 显示当前筛选条件下的订单总数
 *    - 显示当前页的订单条数和总页数
 *
 * @param searchParams - URL 查询参数（Promise）
 */
export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const token = await getToken();
  if (!token) return null;

  const t = await getTranslations('admin.orders');
  const tc = await getTranslations('common');
  const params = await searchParams;
  const activeTab = params.tab === 'delivery' ? 'delivery' : 'all';

  const query = new URLSearchParams();
  query.set('page', params.page ?? '1');
  query.set('limit', '20');
  if (params.status) query.set('status', params.status);
  if (params.fulfillmentType) query.set('fulfillmentType', params.fulfillmentType);

  let orders: PlatformOrder[] = [];
  let meta = { total: 0, page: 1, limit: 20 };
  try {
    const res = await apiFetch<PaginatedResponse<PlatformOrder>>(
      `/platform/orders?${query.toString()}`,
      {},
      token,
    );
    orders = res.data;
    meta = res.meta;
  } catch {
    orders = [];
  }

  const metrics = [
    {
      title: activeTab === 'delivery' ? t('tabDelivery') : t('title'),
      value: meta.total,
      description: activeTab === 'delivery' ? t('description') : undefined,
    },
    {
      title: tc('pageOf', {
        page: meta.page,
        total: Math.max(1, Math.ceil(meta.total / meta.limit)),
      }),
      value: orders.length,
    },
  ];

  return (
    <AdminShellWrapper>
      <div className="space-y-6">
        <BentoListHeader metrics={metrics} />
        <ListPageFrame
          title={t('title')}
          description={t('description')}
          emptyState={
            orders.length === 0 ? <EmptyState title={t('empty')} /> : undefined
          }
        >
          <Suspense>
            <OrdersView orders={orders} token={token} activeTab={activeTab} />
          </Suspense>
        </ListPageFrame>
      </div>
    </AdminShellWrapper>
  );
}
