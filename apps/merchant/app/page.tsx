/**
 * 商户门户首页 - 仪表盘页面
 *
 * 功能说明:
 * - 展示商户的核心业务指标（客户数、线索数、经销商绑定、订单、佣金等）
 * - 显示最近线索（Leads）列表，便于快速跟进销售机会
 * - 展示最近活动记录（绑定创建、订单支付、佣金应计）
 * - 提供业务趋势图表，直观展示订单和佣金变化
 *
 * 使用场景:
 * - 商户用户（店长/运营人员）登录后首先看到的首页
 * - 快速了解当前业务状况和重要待办事项
 * - 监控销售额、佣金收入和库存情况
 *
 * 数据来源:
 * - 从 /merchant/dashboard API 获取商户专属统计数据
 * - 使用 merchant.dashboard i18n 命名空间
 */
import { getLocale, getTranslations } from 'next-intl/server';
import Link from 'next/link';
import {
  Badge,
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
import { LeadStage, type MerchantDashboardStats } from '@meridian/shared';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { apiFetch, ApiError } from '@/lib/api';
import { getToken } from '@/lib/auth';

/**
 * 线索阶段对应的 Badge 样式映射
 *
 * LeadStage 是 CRM 模块中的销售线索状态枚举:
 * - NEW: 新线索，刚录入系统
 * - QUALIFIED: 已筛选，有意向的客户
 * - WON: 成交，已成功转化
 * - LOST: 失败，已确认不会成交
 *
 * 样式含义:
 * - default: 默认灰色，适用于 NEW 状态
 * - warning: 警告黄色，适用于 QUALIFIED（需要重点跟进）
 * - success: 成功绿色，适用于 WON（已成交）
 * - destructive: 危险红色，适用于 LOST（失败）
 */
const stageVariant: Record<string, 'default' | 'warning' | 'success' | 'destructive'> = {
  [LeadStage.NEW]: 'default',
  [LeadStage.QUALIFIED]: 'warning',
  [LeadStage.WON]: 'success',
  [LeadStage.LOST]: 'destructive',
};

/**
 * 格式化货币金额显示
 *
 * @param value - 金额值，字符串或数字类型
 * @param locale - 本地化标识符
 * @returns 格式化后的货币字符串，如 "$1,234.56"
 *
 * 使用场景:
 * - 订单金额、佣金收入、资金余额等货币数据展示
 */
function formatMoney(value: string | number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(
    Number(value),
  );
}

/**
 * 商户仪表盘页面主组件
 *
 * 页面布局:
 * - MerchantShellWrapper: 商户门户框架，传入 businessName 显示商户名称
 * - BentoDashboardFrame: 仪表盘网格布局组件
 *
 * 核心功能:
 * 1. 指标卡片（BentoMetricTile）- 展示 8 个关键指标:
 *    - contactsCount: CRM 中录入的客户/联系人总数
 *    - openLeads: 当前打开（未成交/未失败）的线索数量
 *    - activeDistributors: 已绑定且活跃的经销商数量
 *    - recentBindings: 近30天新增的绑定数
 *    - ordersLast30Days: 近30天订单数量
 *    - revenueLast30Days: 近30天订单总金额
 *    - commissionAccruedLast30Days: 近30天应计佣金总额
 *    - lowStockCount: 当前低库存商品数量（需要及时补货）
 *
 * 2. 趋势图表（BentoChartTile）
 *    - 展示近30天订单数量和佣金应计的变化趋势
 *    - 支持两条数据系列对比查看
 *
 * 3. 最近线索表格（BentoTile）
 *    - 显示最新的销售线索
 *    - 包含: 线索标题、阶段（Badge）、来源、更新时间
 *    - 提供快速跳转链接添加新联系人
 *
 * 4. 最近活动列表（BentoTile）
 *    - 按时间倒序展示最近的业务活动
 *    - 活动类型:
 *      - binding.created: 新的经销商-商户绑定
 *      - order.paid: 订单已支付
 *      - commission.accrued: 佣金应计到账
 *    - 每条活动显示关联的经销商名称和涉及金额
 *
 * 错误处理:
 * - API 调用失败时显示红色告警框
 * - stats 为 null 时不渲染数据区域
 */
export default async function DashboardPage() {
  const locale = await getLocale();
  const t = await getTranslations('merchant.dashboard');
  const token = await getToken();
  if (!token) return null;

  let stats: MerchantDashboardStats | null = null;
  let error: string | null = null;
  try {
    stats = await apiFetch<MerchantDashboardStats>('/merchant/dashboard', {}, token);
  } catch (err) {
    error = err instanceof ApiError ? err.message : t('loadError');
  }

  return (
    <MerchantShellWrapper businessName={stats?.businessName}>
      <BentoDashboardFrame
        title={stats ? t('welcome', { name: stats.businessName }) : t('title')}
        alert={
          error ? (
            <div
              className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
              role="alert"
            >
              {error}
            </div>
          ) : undefined
        }
      >
        {stats ? (
          <>
            <BentoMetricTile title={t('contacts')} value={stats.contactsCount} />
            <BentoMetricTile title={t('openLeads')} value={stats.openLeads} />
            <BentoMetricTile title={t('activeDistributors')} value={stats.activeDistributors} />
            <BentoMetricTile title={t('bindingsLast30')} value={stats.recentBindings} />
            <BentoMetricTile title={t('ordersLast30')} value={stats.ordersLast30Days} />
            <BentoMetricTile
              title={t('revenueLast30')}
              value={formatMoney(stats.revenueLast30Days, locale)}
            />
            <BentoMetricTile
              title={t('commissionAccruedLast30')}
              value={formatMoney(stats.commissionAccruedLast30Days, locale)}
            />
            <BentoMetricTile title={t('lowStock')} value={stats.lowStockCount} />
            <BentoChartTile
              title={t('trendChart')}
              colSpan={2}
              rowSpan={2}
              data={stats.trend.map((point) => ({
                date: point.date,
                orderCount: point.orderCount,
                commissionAccrued: Number(point.commissionAccrued),
              }))}
              series={[
                { key: 'orderCount', label: t('ordersLast30') },
                { key: 'commissionAccrued', label: t('commissionAccruedLast30') },
              ]}
            />
            <BentoTile colSpan={2}>
              <div className="space-y-4 p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium">{t('recentLeads')}</h2>
                  <div className="flex gap-2">
                    <Link href="/crm/contacts" className="text-sm text-primary hover:underline">
                      {t('addContact')}
                    </Link>
                  </div>
                </div>
                {stats.recentLeads.length === 0 ? (
                  <EmptyState title={t('noLeadsYet')} />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('tableTitle')}</TableHead>
                        <TableHead>{t('tableStage')}</TableHead>
                        <TableHead>{t('tableSource')}</TableHead>
                        <TableHead>{t('tableCreated')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.recentLeads.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell className="font-medium">{lead.title}</TableCell>
                          <TableCell>
                            <Badge variant={stageVariant[lead.stage] ?? 'secondary'}>
                              {lead.stage}
                            </Badge>
                          </TableCell>
                          <TableCell>{lead.source ?? '—'}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(lead.updatedAt).toLocaleDateString(locale)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </BentoTile>
            <BentoTile colSpan={2}>
              <div className="space-y-4 p-4 md:p-6">
                <h2 className="text-lg font-medium">{t('recentActivity')}</h2>
                {stats.recentActivity.length === 0 ? (
                  <EmptyState title={t('noLeadsYet')} />
                ) : (
                  <div className="divide-y text-sm">
                    {stats.recentActivity.map((item, i) => (
                      <div
                        key={`${item.type}-${item.occurredAt}-${i}`}
                        className="flex justify-between gap-4 py-3 first:pt-0 last:pb-0"
                      >
                        <span>
                          {item.type === 'binding.created'
                            ? t('activityBindingCreated', {
                                bindType: item.bindType ?? '—',
                              })
                            : item.type === 'order.paid'
                              ? t('activityOrderPaid')
                              : t('activityCommissionAccrued')}
                          {item.distributorName ? ` · ${item.distributorName}` : null}
                          {item.amount != null
                            ? ` · ${formatMoney(item.amount, locale)}`
                            : null}
                        </span>
                        <span className="shrink-0 text-muted-foreground">
                          {new Date(item.occurredAt).toLocaleDateString(locale)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </BentoTile>
          </>
        ) : null}
      </BentoDashboardFrame>
    </MerchantShellWrapper>
  );
}
