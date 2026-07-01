/**
 * 商户资金汇总页面
 *
 * 功能说明:
 * - 展示商户的资金状况和交易流水
 * - 支持按日期范围筛选资金数据
 * - 显示收入、支出和余额等关键指标
 * - 详细展示资金变动明细
 *
 * 使用场景:
 * - 商户财务人员查看账户资金状况
 * - 核对资金流水和余额
 * - 分析收入来源和支出情况
 *
 * 数据来源:
 * - 资金汇总: /merchant/funds/summary API（支持 from/to 日期参数）
 * - 商户资料: /merchant/onboarding API
 * - 使用 merchant.funds i18n 命名空间
 *
 * 日期筛选说明:
 * - from: 开始日期（可选，ISO 格式）
 * - to: 结束日期（可选，ISO 格式）
 * - 不传日期参数时返回全部历史数据
 */
import { getTranslations } from 'next-intl/server';
import type { MerchantFundsSummary } from '@meridian/shared';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { apiFetch, type OnboardingProfile } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { MerchantFundsPanel } from './_components/merchant-funds-panel';

/**
 * 资金页面主组件
 *
 * 页面布局:
 * - MerchantShellWrapper: 商户门户框架（传入 businessName 显示商户名称）
 * - MerchantFundsPanel: 资金面板子组件
 *
 * 核心功能:
 * 1. 日期筛选
 *    - 从 URL searchParams 获取 from/to 参数
 *    - 传递给 API 进行日期范围筛选
 *
 * 2. 数据并行加载
 *    - summary: 资金汇总数据
 *    - profile: 商户基本资料
 *    - 两个接口并行调用，提高加载速度
 *
 * 3. MerchantFundsPanel 子组件
 *    - 渲染资金指标卡片
 *    - 展示资金流水列表
 *    - 支持日期范围选择
 *    - 接收 token 用于可能的操作（如导出）
 *
 * 错误处理:
 * - API 失败时显示红色错误提示
 * - 使用 null 检查确保数据完整性
 *
 * @param searchParams - URL 查询参数（Promise），包含 from/to 日期筛选
 */
export default async function FundsPage({
  searchParams,
}: {
  /** 查询参数：日期范围筛选 */
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const t = await getTranslations('merchant.funds');
  const token = await getToken();
  if (!token) return null;

  const params = await searchParams;
  const query = new URLSearchParams();
  if (params.from) query.set('from', params.from);
  if (params.to) query.set('to', params.to);
  const path = `/merchant/funds/summary${query.toString() ? `?${query}` : ''}`;

  const [summary, profile] = await Promise.all([
    apiFetch<MerchantFundsSummary>(path, {}, token).catch(() => null),
    apiFetch<OnboardingProfile>('/merchant/onboarding', {}, token).catch(() => null),
  ]);

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      {summary ? (
        <MerchantFundsPanel
          initialSummary={summary}
          token={token}
          businessName={profile?.businessName}
        />
      ) : (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {t('loadError')}
        </div>
      )}
    </MerchantShellWrapper>
  );
}
