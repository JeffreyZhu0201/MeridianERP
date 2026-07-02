/**
 * 经销商分店管理页面
 *
 * 功能说明:
 * - 展示经销商招募的所有分店（商户）列表
 * - 显示各分店的招募时间和业绩数据
 * - 统计分店总数、近30天订单数和销售额
 * - 查看各分店与经销商的绑定关系
 *
 * 使用场景:
 * - 经销商查看已招募的分店列表
 * - 跟踪分店业绩表现
 * - 管理分店绑定关系
 *
 * 数据来源:
 * - 分店列表: /distributor/me/branches API
 * - 使用 distributor.branches i18n 命名空间
 *
 * 业务说明:
 * - 分店（Branch）是指通过经销商招募的商户
 * - 经销商通过绑定关系获得分店订单的佣金
 * - recruitedAt 表示经销商与该商户建立绑定关系的时间
 */
import { getLocale, getTranslations } from 'next-intl/server';
import {
  BentoListHeader,
  EmptyState,
  ListPageFrame,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  formatMoney,
} from '@meridian/ui';
import type { DistributorBranchSummary } from '@meridian/shared';

import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';

/**
 * 分店列表页面主组件
 *
 * 页面布局:
 * - ListPageFrame: 列表页面框架
 *
 * 核心功能:
 * 1. 分店数据加载
 *    - 调用 /distributor/me/branches API 获取分店列表
 *    - 错误时显示错误提示并降级为空列表
 *
 * 2. 指标卡片
 *    - 显示分店总数
 *
 * 3. 分店表格
 *    - businessName: 分店商户的企业名称
 *    - slug: 分店的商店 slug（/s/{slug}）
 *    - recruitedAt: 绑定关系建立时间
 *    - orderCountLast30Days: 近30天订单数
 *    - salesLast30Days: 近30天销售额
 *
 * DistributorBranchSummary 类型说明:
 * - tenantId: 分店商户的租户 ID
 * - businessName: 商户企业名称
 * - slug: 商店 slug
 * - recruitedAt: 绑定时间
 * - orderCountLast30Days: 近30天归因订单数
 * - salesLast30Days: 近30天归因销售额
 */
export default async function BranchesPage() {
  const locale = await getLocale();
  const t = await getTranslations('distributor.branches');
  const token = await getToken();
  if (!token) return null;

  let branches: DistributorBranchSummary[] = [];
  let error: string | null = null;

  try {
    branches = await apiFetch<DistributorBranchSummary[]>('/distributor/me/branches', {}, token);
  } catch (err) {
    error = err instanceof Error ? err.message : t('loadError');
  }

  return (
    <ListPageFrame
      title={t('title')}
      description={t('description')}
      emptyState={
        branches.length === 0 && !error ? (
          <EmptyState title={t('emptyTitle')} description={t('emptyDescription')} />
        ) : undefined
      }
    >
      {error ? (
        <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      {branches.length > 0 ? (
        <div className="space-y-4">
          <BentoListHeader metrics={[{ title: t('title'), value: branches.length }]} />
          <div className="rounded-xl ring-1 ring-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('businessName')}</TableHead>
                  <TableHead>{t('slug')}</TableHead>
                  <TableHead>{t('recruitedAt')}</TableHead>
                  <TableHead className="text-right">{t('orderCount')}</TableHead>
                  <TableHead className="text-right">{t('salesLast30')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {branches.map((branch) => (
                  <TableRow key={branch.tenantId}>
                    <TableCell className="font-medium">{branch.businessName}</TableCell>
                    <TableCell className="font-mono text-xs">{branch.slug}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {branch.recruitedAt
                        ? new Date(branch.recruitedAt).toLocaleDateString(locale)
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {branch.orderCountLast30Days}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(branch.salesLast30Days, locale)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : null}
    </ListPageFrame>
  );
}
