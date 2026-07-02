/**
 * 商户订单管理页面
 *
 * 功能说明:
 * - 展示商户所有订单的列表视图
 * - 区分普通订单和待自提订单（pickup-pending）
 * - 统计已支付订单数量和总收入金额
 * - 支持订单状态管理和自提验证操作
 *
 * 使用场景:
 * - 商户店员查看和处理客户订单
 * - 验证客户到店自提的订单
 * - 跟踪订单履约状态（配送/自提）
 *
 * 数据来源:
 * - 订单列表: /merchant/orders API
 * - 待自提订单: /merchant/orders/pickup-pending API
 * - 商户资料: /merchant/onboarding API
 * - 使用 merchant.orders i18n 命名空间
 */
import { getTranslations } from 'next-intl/server';
import { BentoListHeader, formatMoney, ListPageFrame } from '@meridian/ui';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { apiFetch, type OnboardingProfile } from '@/lib/api';
import { getToken } from '@/lib/auth';
import type { MerchantOrderListItem } from '@meridian/shared';
import { OrderStatus } from '@meridian/shared';
import { OrdersPanel } from './_components/orders-panel';

/**
 * 订单页面主组件
 *
 * 页面布局:
 * - MerchantShellWrapper: 商户门户框架
 * - BentoListHeader: 顶部指标卡片
 * - ListPageFrame: 列表页面框架
 *
 * 核心功能:
 * 1. 数据并行加载
 *    - 使用 Promise.all 同时获取三个接口数据:
 *      - orders: 商户所有订单列表
 *      - pickupPending: 待自提的订单列表（客户已付款等待到店自提）
 *      - profile: 商户基本资料（用于显示商户名称）
 *    - 任意接口失败不影响其他数据展示
 *
 * 2. 订单状态（OrderStatus 枚举）
 *    - PENDING: 待支付
 *    - PAID: 已支付（等待履约）
 *    - PROCESSING: 处理中
 *    - COMPLETED: 已完成（已自提或已配送）
 *    - CANCELLED: 已取消
 *    - REFUNDED: 已退款
 *
 * 3. 指标卡片统计
 *    - orders.length: 订单总数
 *    - pickupPending.length: 待自提订单数（需要重点关注）
 *    - paidCount: 已支付订单数
 *    - revenueTotal: 已支付订单的总金额
 *    - 计算方式: 筛选 status === PAID 的订单，累加 total 字段
 *
 * 4. OrdersPanel 子组件
 *    - 渲染订单列表和待自提订单
 *    - 支持 Tab 切换查看不同状态的订单
 *    - 接收 token 用于调用需要认证的操作（如验证自提）
 *
 * 业务逻辑说明:
 * - 自提订单需要客户到店后由店员验证二维码完成履约
 * - pickup-pending 是已支付但尚未完成自提的订单
 */
export default async function OrdersPage() {
  const t = await getTranslations('merchant.orders');
  const token = await getToken();
  if (!token) return null;

  const [orders, pickupPending, profile] = await Promise.all([
    apiFetch<MerchantOrderListItem[]>('/merchant/orders', {}, token).catch(() => []),
    apiFetch<MerchantOrderListItem[]>('/merchant/orders/pickup-pending', {}, token).catch(
      () => [],
    ),
    apiFetch<OnboardingProfile>('/merchant/onboarding', {}, token).catch(() => null),
  ]);

  const paidCount = orders.filter((o) => o.status === OrderStatus.PAID).length;
  const revenueTotal = orders
    .filter((o) => o.status === OrderStatus.PAID)
    .reduce((sum, o) => sum + Number(o.total), 0);

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      <ListPageFrame title={t('title')} description={t('description')}>
        <BentoListHeader
          metrics={[
            { title: t('title'), value: orders.length },
            { title: t('tabs.pickupPending'), value: pickupPending.length },
            { title: t('table.status'), value: paidCount },
            {
              title: t('table.total'),
              value: formatMoney(revenueTotal),
            },
          ]}
        />
        <OrdersPanel orders={orders} pickupPending={pickupPending} token={token} />
      </ListPageFrame>
    </MerchantShellWrapper>
  );
}
