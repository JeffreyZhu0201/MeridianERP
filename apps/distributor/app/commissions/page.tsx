/**
 * 经销商佣金账本页面
 *
 * 功能说明:
 * - 展示经销商的佣金收入明细记录
 * - 按状态（应计/已结算/已作废）分类显示佣金
 * - 统计累计应计佣金和累计已结算佣金
 * - 支持查看每条佣金记录对应的订单信息
 *
 * 使用场景:
 * - 经销商查看通过绑定关系获得的佣金收入
 * - 核对佣金计算是否正确
 * - 申请佣金提现
 *
 * 数据来源:
 * - 佣金账本: /distributor/me/commissions API
 * - 使用 distributor.commissions i18n 命名空间
 *
 * 佣金类型说明:
 * - 应计佣金 (ACCRUED): 订单完成后应计入但尚未结算的佣金
 * - 已结算佣金 (SETTLED): 已完成结算可以提现的佣金
 * - 已作废佣金 (VOID): 因订单退款等原因被撤销的佣金
 */
import { getLocale, getTranslations } from 'next-intl/server';
import {
  Badge,
  BentoListHeader,
  EmptyState,
  ListPageFrame,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@meridian/ui';
import { LedgerStatus } from '@meridian/shared';

import {
  apiFetch,
  type DistributorCommissionListResponse,
} from '@/lib/api';
import { getToken } from '@/lib/auth';

/**
 * 佣金状态对应的 Badge 样式映射
 *
 * LedgerStatus 枚举值:
 * - ACCRUED: 应计佣金（订单完成后应计入，等待结算）
 * - SETTLED: 已结算佣金（已打款/可提现）
 * - VOID: 已作废佣金（因退款等原因被撤销）
 *
 * 样式含义:
 * - warning: 黄色警告色，表示待处理状态
 * - success: 绿色成功色，表示已完成
 * - destructive: 红色危险色，表示已作废
 */
const statusVariant: Record<string, 'default' | 'warning' | 'success' | 'destructive'> = {
  [LedgerStatus.ACCRUED]: 'warning',
  [LedgerStatus.SETTLED]: 'success',
  [LedgerStatus.VOID]: 'destructive',
};

/**
 * 格式化货币金额显示
 *
 * @param value - 金额值，字符串或数字类型
 * @param locale - 本地化标识符
 * @returns 格式化后的货币字符串
 */
function formatMoney(value: string | number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(
    Number(value),
  );
}

/**
 * 佣金账本页面主组件
 *
 * 页面布局:
 * - 独立的 div 容器（无 Shell Wrapper，由父级提供）
 * - BentoListHeader: 顶部指标卡片区域
 * - ListPageFrame: 列表页面框架
 *
 * 核心功能:
 * 1. 指标卡片
 *    - title: 佣金记录总数
 *    - amount: 累计总佣金（应计 + 已结算）
 *    - commissionAccrued: 累计应计佣金
 *    - commissionSettled: 累计已结算佣金
 *
 * 2. 佣金表格
 *    - orderReference: 关联的订单编号（点击可查看订单详情）
 *    - amount: 佣金金额
 *    - status: 佣金状态（应计/已结算/已作废）
 *    - createdAt: 佣金记录创建时间
 *
 * 3. 状态统计计算
 *    - accruedTotal: 通过筛选 LedgerStatus.ACCRUED 累加
 *    - settledTotal: 通过筛选 LedgerStatus.SETTLED 累加
 *
 * 错误处理:
 * - API 调用失败显示错误提示，但仍显示页面框架
 * - 数据为空时显示空状态
 */
export default async function CommissionsPage() {
  const locale = await getLocale();
  const t = await getTranslations('distributor.commissions');
  const td = await getTranslations('distributor.dashboard');
  const token = await getToken();
  if (!token) return null;

  let commissions: DistributorCommissionListResponse | null = null;
  let error: string | null = null;

  try {
    commissions = await apiFetch<DistributorCommissionListResponse>(
      '/distributor/me/commissions',
      {},
      token,
    );
  } catch (err) {
    error = err instanceof Error ? err.message : t('loadError');
  }

  const isEmpty = !commissions?.items.length;
  const accruedTotal = commissions?.items
    .filter((row) => row.status === LedgerStatus.ACCRUED)
    .reduce((sum, row) => sum + Number(row.amount), 0) ?? 0;
  const settledTotal = commissions?.items
    .filter((row) => row.status === LedgerStatus.SETTLED)
    .reduce((sum, row) => sum + Number(row.amount), 0) ?? 0;

  return (
    <div className="space-y-6">
      {commissions ? (
        <BentoListHeader
          metrics={[
            { title: t('title'), value: commissions.total },
            { title: t('amount'), value: formatMoney(accruedTotal + settledTotal, locale) },
            { title: td('commissionAccrued'), value: formatMoney(accruedTotal, locale) },
            { title: td('commissionSettled'), value: formatMoney(settledTotal, locale) },
          ]}
        />
      ) : null}
      <ListPageFrame
        title={t('title')}
        description={t('description')}
        emptyState={
          isEmpty && !error ? (
            <EmptyState title={t('emptyTitle')} description={t('emptyDescription')} />
          ) : undefined
        }
      >
        {error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}
        {!isEmpty && commissions ? (
          <div className="rounded-xl ring-1 ring-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('order')}</TableHead>
                  <TableHead>{t('amount')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead>{t('created')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.items.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-xs">{row.orderReference}</TableCell>
                    <TableCell>{formatMoney(row.amount, locale)}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[row.status] ?? 'secondary'}>
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(row.createdAt).toLocaleDateString(locale)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : null}
      </ListPageFrame>
    </div>
  );
}
