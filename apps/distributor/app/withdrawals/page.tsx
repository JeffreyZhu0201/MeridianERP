/**
 * 经销商提现申请页面
 *
 * 功能说明:
 * - 展示经销商的佣金提现申请记录
 * - 显示当前可提现余额
 * - 支持提交新的提现申请
 * - 查看历史提现申请状态和详情
 *
 * 使用场景:
 * - 经销商将已结算佣金申请提现到银行账户
 * - 查看提现申请的处理进度
 * - 核对历史提现金额记录
 *
 * 数据来源:
 * - 提现记录: /distributor/me/withdrawals API
 * - 可用余额: 从 /distributor/me/dashboard API 获取
 * - 使用 distributor.withdrawals i18n 命名空间
 *
 * 提现流程:
 * 1. 经销商查看可用余额
 * 2. 提交提现申请（输入提现金额和银行账户信息）
 * 3. 平台审核通过后打款
 * 4. 提现状态更新为已完成
 */
import { getTranslations } from 'next-intl/server';
import { ListPageFrame } from '@meridian/ui';
import type { DistributorDashboard, WithdrawalRequestRow } from '@meridian/shared';

import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { WithdrawalsPanel } from './_components/withdrawals-panel';

/**
 * 提现申请页面主组件
 *
 * 页面布局:
 * - ListPageFrame: 列表页面框架
 *
 * 核心功能:
 * 1. 数据并行加载
 *    - 使用 Promise.all 同时获取:
 *      - withdrawals: 提现申请历史记录
 *      - dashboard: 仪表盘数据（含可用余额）
 *
 * 2. 可用余额
 *    - 从 dashboard.availableBalance 获取
 *    - 展示在提现面板中供用户参考
 *
 * 3. WithdrawalsPanel 子组件
 *    - 渲染提现申请列表
 *    - 提供提现申请表单
 *    - 显示历史提现记录
 *    - 接收 availableBalance 用于验证提现金额
 *
 * 错误处理:
 * - 任意 API 失败时使用空数组/null 作为降级
 * - 页面仍能正常展示（可能显示空状态）
 */
export default async function WithdrawalsPage() {
  const t = await getTranslations('distributor.withdrawals');
  const token = await getToken();
  if (!token) return null;

  const [withdrawals, dashboard] = await Promise.all([
    apiFetch<WithdrawalRequestRow[]>('/distributor/me/withdrawals', {}, token).catch(() => []),
    apiFetch<DistributorDashboard>('/distributor/me/dashboard', {}, token).catch(() => null),
  ]);

  const availableBalance = Number(dashboard?.availableBalance ?? 0);

  return (
    <ListPageFrame title={t('title')} description={t('description')}>
      <WithdrawalsPanel
        withdrawals={withdrawals}
        availableBalance={availableBalance}
        token={token}
      />
    </ListPageFrame>
  );
}
