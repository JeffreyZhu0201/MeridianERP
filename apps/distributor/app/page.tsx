/**
 * 经销商门户首页 - 仪表盘页面
 *
 * 功能说明:
 * - 展示经销商的核心业务指标（分店数、订单量、佣金收入等）
 * - 显示可提现余额和累计佣金数据
 * - 提供业务趋势图表，展示订单和佣金变化
 *
 * 使用场景:
 * - 渠道经销商登录后首先看到的首页
 * - 快速了解招募的分店业绩状况
 * - 查看佣金收入和结算情况
 *
 * 数据来源:
 * - 从 /distributor/me/dashboard API 获取经销商专属统计数据
 * - 使用 distributor.dashboard i18n 命名空间
 */
import { getLocale, getTranslations } from 'next-intl/server';
import {
  BentoChartTile,
  BentoDashboardFrame,
  BentoMetricTile,
  formatMoney,
} from '@meridian/ui';

import { apiFetch, ApiError, type DistributorDashboard } from '@/lib/api';
import { getToken } from '@/lib/auth';

/**
 * 加载经销商仪表盘数据
 *
 * @param token - 当前用户的 JWT 认证令牌
 * @param loadFailedMessage - 加载失败时显示的默认错误消息（从 i18n 获取）
 * @returns 包含仪表盘数据或错误信息的对象
 *
 * 职责:
 * - 调用经销商 Dashboard API 获取最新业务指标
 * - 统一处理 API 错误
 * - 返回结构化数据供页面渲染使用
 */
async function loadDashboard(
  token: string,
  loadFailedMessage: string,
): Promise<{ dashboard: DistributorDashboard | null; error: string | null }> {
  try {
    // 调用经销商个人仪表盘接口
    const dashboard = await apiFetch<DistributorDashboard>('/distributor/me/dashboard', {}, token);
    return { dashboard, error: null };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : loadFailedMessage;
    return { dashboard: null, error: message };
  }
}

/**
 * 经销商仪表盘页面主组件
 *
 * 页面布局:
 * - BentoDashboardFrame: 仪表盘网格布局组件
 *
 * 核心功能:
 * 1. 指标卡片（BentoMetricTile）- 展示 7 个关键指标:
 *    - branchCount: 招募的分店总数
 *    - availableBalance: 当前可提现余额
 *    - attributedOrderCount: 归因订单总数（通过绑定关系产生的订单）
 *    - attributedOrderRevenue: 归因订单总金额
 *    - commissionSummary.accruedTotal: 累计应计佣金
 *    - commissionSummary.settledTotal: 累计已结算佣金
 *
 * 2. 趋势图表（BentoChartTile）
 *    - 展示订单数量、订单金额、佣金应计的变化趋势
 *    - 支持多条数据系列对比分析
 *
 * 3. 欢迎信息
 *    - 显示经销商名称（从 dashboard.distributorName 获取）
 *    - 提供简短的业务描述
 *
 * 错误处理:
 * - API 调用失败时显示红色告警框，包含错误详情
 * - 数据加载中不渲染指标区域
 */
export default async function DashboardPage() {
  const token = await getToken();
  if (!token) return null;

  const locale = await getLocale();
  const t = await getTranslations('distributor.dashboard');
  const { dashboard, error } = await loadDashboard(token, t('loadError'));

  return (
    <BentoDashboardFrame
      title={
        dashboard ? t('welcome', { name: dashboard.distributorName }) : t('title')
      }
      description={dashboard ? t('description') : undefined}
      alert={
        error ? (
          <div
            className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm"
            role="alert"
          >
            <p className="font-medium text-destructive">{t('loadError')}</p>
            <p className="mt-1 text-muted-foreground">{error}</p>
          </div>
        ) : undefined
      }
    >
      {dashboard ? (
        <>
          <BentoMetricTile title={t('branchCount')} value={dashboard.branchCount} />
          <BentoMetricTile
            title={t('availableBalance')}
            value={formatMoney(dashboard.availableBalance, locale)}
          />
          <BentoMetricTile title={t('attributedOrders')} value={dashboard.attributedOrderCount} />
          <BentoMetricTile
            title={t('orderRevenue')}
            value={formatMoney(dashboard.attributedOrderRevenue, locale)}
          />
          <BentoMetricTile
            title={t('commissionAccrued')}
            value={formatMoney(dashboard.commissionSummary.accruedTotal, locale)}
          />
          <BentoMetricTile
            title={t('commissionSettled')}
            value={formatMoney(dashboard.commissionSummary.settledTotal, locale)}
          />
          <BentoChartTile
            title={t('trendChart')}
            colSpan={2}
            rowSpan={2}
            data={dashboard.trend.map((point) => ({
              date: point.date,
              orderCount: point.orderCount,
              orderRevenue: Number(point.orderRevenue),
              commissionAccrued: Number(point.commissionAccrued),
            }))}
            series={[
              { key: 'orderCount', label: t('attributedOrders') },
              { key: 'commissionAccrued', label: t('commissionAccrued') },
            ]}
          />
        </>
      ) : null}
    </BentoDashboardFrame>
  );
}
