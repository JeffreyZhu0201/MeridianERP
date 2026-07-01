/**
 * 平台资金汇总页面
 *
 * 功能说明:
 * - 展示平台整体的资金状况和关键指标
 * - 支持按日期范围筛选资金数据
 * - 显示平台 GMV（成交总额）和待处理提现金额
 * - 详细展示资金流水和分布情况
 *
 * 使用场景:
 * - 平台财务人员查看整体资金状况
 * - 监控平台交易额和资金流动
 * - 分析资金分布和结算情况
 *
 * 数据来源:
 * - 资金汇总: /platform/funds/summary API（支持 from/to 日期参数）
 * - 使用 admin.funds i18n 命名空间
 *
 * 日期筛选说明:
 * - from: 开始日期（可选，ISO 格式）
 * - to: 结束日期（可选，ISO 格式）
 * - 不传日期参数时返回全部历史数据
 */
import { getTranslations } from 'next-intl/server';
import { BentoListHeader, ListPageFrame } from '@meridian/ui';
import type { PlatformFundsSummary } from '@meridian/shared';

import { AdminShellWrapper } from '@/components/admin-shell-wrapper';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { FundsView } from './_components/funds-view';

/**
 * FundsPage 组件 Props
 *
 * @property searchParams - URL 查询参数，包含:
 *   - from: 开始日期（ISO 格式字符串）
 *   - to: 结束日期（ISO 格式字符串）
 *
 * 使用方式:
 * - 通过 Next.js 服务端组件 props 接收
 * - 传递给 API 请求用于日期范围筛选
 */
export default async function FundsPage({
  searchParams,
}: {
  /** 查询参数：日期范围筛选 */
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const token = await getToken();
  if (!token) return null;

  const t = await getTranslations('admin.funds');
  const params = await searchParams;
  const query = new URLSearchParams();
  if (params.from) query.set('from', params.from);
  if (params.to) query.set('to', params.to);
  const path = `/platform/funds/summary${query.toString() ? `?${query}` : ''}`;

  let summary: PlatformFundsSummary | null = null;
  try {
    summary = await apiFetch<PlatformFundsSummary>(path, {}, token);
  } catch {
    summary = null;
  }

  return (
    <AdminShellWrapper>
      <div className="space-y-6">
        {summary ? (
          <BentoListHeader
            metrics={[
              { title: t('gmv'), value: String(summary.gmv) },
              { title: t('pendingWithdrawals'), value: String(summary.pendingWithdrawals) },
            ]}
          />
        ) : null}
        <ListPageFrame title={t('title')} description={t('description')}>
          {summary ? <FundsView initialSummary={summary} token={token} /> : null}
        </ListPageFrame>
      </div>
    </AdminShellWrapper>
  );
}
