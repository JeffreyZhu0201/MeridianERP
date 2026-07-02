/**
 * 商户提现申请管理页面
 *
 * 功能说明:
 * - 展示商户提交的提现申请列表
 * - 默认只显示待处理（PENDING）状态的申请
 * - 统计待处理提现的总金额
 * - 支持管理员审核通过或拒绝提现申请
 *
 * 使用场景:
 * - 平台财务人员处理商户的佣金/余额提现请求
 * - 查看待处理的提现申请列表
 * - 快速跳转到结算页面进行批量处理
 *
 * 数据来源:
 * - 提现申请列表: /platform/withdrawals?status=PENDING API
 * - 使用 admin.withdrawals i18n 命名空间
 *
 * 业务说明:
 * - 提现申请状态: PENDING（待处理）→ APPROVED（已批准）/ REJECTED（已拒绝）
 * - 批准后资金从平台账户转出到商户指定账户
 * - CNY 货币格式显示（商户主要使用人民币结算）
 */
import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { BentoListHeader, Button, EmptyState, formatMoney, ListPageFrame } from '@meridian/ui';

import { AdminShellWrapper } from '@/components/admin-shell-wrapper';
import { apiFetch, type WithdrawalRequest } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { WithdrawalsTable } from './_components/withdrawals-table';

/** 货币类型常量 - 使用人民币结算 */
const CURRENCY = 'CNY';

/**
 * 商户提现申请页面主组件
 *
 * 页面布局:
 * - AdminShellWrapper: 管理门户框架
 * - BentoListHeader: 顶部指标卡片
 * - 提示横幅: 引导用户前往结算页面批量处理
 * - ListPageFrame: 列表页面框架
 *
 * 核心功能:
 * 1. 提现申请筛选
 *    - 默认只加载 PENDING（待处理）状态的申请
 *    - 已处理（APPROVED/REJECTED）的申请不在此页面展示
 *
 * 2. 指标卡片
 *    - title: 待处理提现申请数量
 *    - columns.amount: 待处理提现总金额
 *
 * 3. 快捷入口
 *    - 提供跳转到结算页面的链接
 *    - 用于批量处理结算和提现业务
 *
 * 4. 提现表格 (WithdrawalsTable)
 *    - 渲染待处理提现申请列表
 *    - 支持批准/拒绝操作
 *
 * 注意事项:
 * - 该页面只展示待处理申请，已完成的申请在结算页面查看
 * - 提现涉及资金流动，需谨慎审核
 */
export default async function WithdrawalsPage() {
  const token = await getToken();
  if (!token) return null;

  const locale = await getLocale();
  const t = await getTranslations('admin.withdrawals');

  let withdrawals: WithdrawalRequest[] = [];
  try {
    withdrawals = await apiFetch<WithdrawalRequest[]>(
      '/platform/withdrawals?status=PENDING',
      {},
      token,
    );
  } catch {
    withdrawals = [];
  }

  const pendingTotal = withdrawals.reduce((sum, w) => sum + Number(w.amount), 0);

  const metrics = [
    { title: t('title'), value: withdrawals.length },
    {
      title: t('columns.amount'),
      value: formatMoney(pendingTotal, CURRENCY, locale),
      description: t('description'),
    },
  ];

  return (
    <AdminShellWrapper>
      <div className="space-y-6">
        <BentoListHeader metrics={metrics} />
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm">
          <p>{t('settlementHint')}</p>
          <Link
            href="/settlements"
            className="inline-flex h-8 items-center rounded-md border border-input px-3 text-sm hover:bg-muted"
          >
            {t('goToSettlements')}
          </Link>
        </div>
        <ListPageFrame
          title={t('title')}
          description={t('description')}
          emptyState={
            withdrawals.length === 0 ? <EmptyState title={t('empty')} /> : undefined
          }
        >
          <WithdrawalsTable withdrawals={withdrawals} token={token} />
        </ListPageFrame>
      </div>
    </AdminShellWrapper>
  );
}
