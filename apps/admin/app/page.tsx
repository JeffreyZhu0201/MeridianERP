/**
 * 管理门户首页 - 仪表盘页面
 *
 * 功能说明:
 * - 展示平台关键业务指标的汇总数据（商户总数、待审核商户、活跃经销商、近30天订单等）
 * - 显示最近注册的商户列表，支持快速查看和跳转
 * - 提供订单趋势图表，直观展示业务变化
 *
 * 使用场景:
 * - 平台管理员登录后首先看到的首页
 * - 快速了解平台整体运营状况
 * - 监控商户入驻和订单数据
 *
 * 数据来源:
 * - 从 /platform/dashboard API 获取统计数据
 * - 使用 admin.dashboard i18n 命名空间进行国际化
 */
import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import {
  BentoChartTile,
  BentoDashboardFrame,
  BentoMetricTile,
  BentoTile,
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@meridian/ui';

import { AdminShellWrapper } from '@/components/admin-shell-wrapper';
import { StatusBadge } from '@/components/status-badge';
import { apiFetch, ApiError, type DashboardStats } from '@/lib/api';
import { getToken } from '@/lib/auth';

/**
 * 格式化货币金额显示
 *
 * @param value - 金额值，可以是字符串或数字类型
 * @param locale - 本地化标识符，用于确定数字格式和货币符号
 * @returns 格式化后的货币字符串，如 "$1,234.56"
 *
 * 使用场景:
 * - 用于展示订单金额、佣金金额等各种资金数据
 * - 自动处理金额的千分位分隔和小数位
 */
function formatMoney(value: string | number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(
    Number(value),
  );
}

/**
 * 加载仪表盘统计数据
 *
 * @param token - 当前用户的 JWT 认证令牌
 * @param loadFailedMessage - 加载失败时显示的默认错误消息（从 i18n 获取）
 * @returns 包含统计数据或错误信息的对象
 *
 * 职责:
 * - 调用平台 Dashboard API 获取最新业务指标
 * - 统一处理 API 错误，转换为用户可读的错误消息
 * - 防止错误信息在 UI 层泄漏
 */
async function loadDashboard(
  token: string,
  loadFailedMessage: string,
): Promise<{ stats: DashboardStats | null; error: string | null }> {
  try {
    // 调用平台仪表盘接口，获取商户、订单、佣金等汇总数据
    const stats = await apiFetch<DashboardStats>('/platform/dashboard', {}, token);
    return { stats, error: null };
  } catch (err) {
    // 区分 ApiError（已知错误）和其他异常（未知错误）
    const message = err instanceof ApiError ? err.message : loadFailedMessage;
    return { stats: null, error: message };
  }
}

/**
 * 仪表盘页面主组件
 *
 * 页面布局:
 * - 使用 AdminShellWrapper 包裹，提供管理门户的整体布局和导航
 * - 顶部为告警区域，用于显示加载错误
 * - 主体为 BentoDashboardFrame 网格布局，灵活展示指标卡片和图表
 *
 * 核心功能:
 * 1. 指标卡片（BentoMetricTile）：展示 7 个关键业务指标
 *    - totalMerchants: 商户总数
 *    - pendingReview: 待审核商户数
 *    - activeDistributors: 活跃经销商数
 *    - ordersLast30Days: 近30天订单数
 *    - orderRevenueLast30Days: 近30天订单金额
 *    - bindingsLast30Days: 近30天新增绑定数
 *    - commissionAccruedLast30Days: 近30天应计佣金
 *    - commissionSettledLast30Days: 近30天已结算佣金
 *
 * 2. 趋势图表（BentoChartTile）：展示订单量变化趋势
 *    - 数据来源: stats.trend 数组
 *    - 展示近30天或更长时间段的订单数量变化
 *
 * 3. 最近商户表格（BentoTile）：快速查看最新入驻商户
 *    - 显示商户名称、状态、提交时间
 *    - 支持跳转到商户详情页进行审核
 *
 * 错误处理:
 * - API 调用失败时显示红色告警框，包含具体错误信息
 * - 使用 i18n 消息作为错误提示，保持界面一致性
 */
export default async function DashboardPage() {
  const token = await getToken();
  if (!token) return null;

  const locale = await getLocale();
  const t = await getTranslations('admin.dashboard');
  const tm = await getTranslations('admin.merchants');
  const { stats, error } = await loadDashboard(token, t('loadFailed'));

  return (
    <AdminShellWrapper>
      <BentoDashboardFrame
        title={t('title')}
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
        {stats ? (
          <>
          
            <BentoMetricTile title={t('totalMerchants')} value={stats.totalMerchants} />
            <BentoMetricTile title={t('pendingMerchants')} value={stats.pendingReview} />
            <BentoMetricTile title={t('activeDistributors')} value={stats.activeDistributors} />
            <BentoMetricTile title={t('ordersLast30Days')} value={stats.ordersLast30Days} />
            <BentoMetricTile
              title={t('orderRevenueLast30Days')}
              value={formatMoney(stats.orderRevenueLast30Days, locale)}
            />
            <BentoMetricTile title={t('bindingsLast30Days')} value={stats.bindingsLast30Days} />
            <BentoMetricTile
              title={t('commissionAccruedLast30Days')}
              value={formatMoney(stats.commissionAccruedLast30Days, locale)}
            />
            <BentoMetricTile
              title={t('commissionSettledLast30Days')}
              value={formatMoney(stats.commissionSettledLast30Days, locale)}
            />
            <BentoChartTile
              title={t('trendChart')}
              colSpan={2}
              rowSpan={2}
              data={stats.trend}
              series={[{ key: 'orderCount', label: 'Orders' }]}
            />
            <BentoTile colSpan={4}>
              <div className="space-y-4 p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium">{t('recentMerchants')}</h2>
                  <Link href="/merchants" className="text-sm text-primary hover:underline">
                    {t('viewAll')}
                  </Link>
                </div>
                {stats.recentMerchants.length === 0 ? (
                  <EmptyState title={t('emptyMerchants')} />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('columns.business')}</TableHead>
                        <TableHead>{t('columns.status')}</TableHead>
                        <TableHead>{t('columns.submitted')}</TableHead>
                        <TableHead className="text-right">{t('columns.action')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.recentMerchants.map((merchant) => (
                        <TableRow key={merchant.id}>
                          <TableCell className="font-medium">{merchant.businessName}</TableCell>
                          <TableCell>
                            <StatusBadge status={merchant.onboardingStatus} />
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {merchant.submittedAt
                              ? new Date(merchant.submittedAt).toLocaleDateString(locale)
                              : '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link
                              href={`/merchants/${merchant.id}`}
                              className="text-sm text-primary hover:underline"
                            >
                              {tm('view')}
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </BentoTile>
          </>
        ) : null}
      </BentoDashboardFrame>
    </AdminShellWrapper>
  );
}
