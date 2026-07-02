/**
 * 商户佣金账本页面
 *
 * 功能说明:
 * - 展示商户向各经销商支付佣金的记录明细
 * - 按时间范围筛选佣金数据
 * - 按经销商筛选佣金记录
 * - 按状态（应计/已结算）筛选
 * - 统计佣金汇总数据（应计总额、已结算总额、总佣金）
 *
 * 使用场景:
 * - 商户财务人员核对佣金支出
 * - 查看各经销商的佣金计算明细
 * - 按时间范围统计佣金支出
 *
 * 数据来源:
 * - 佣金列表: /merchant/commissions API
 * - 佣金汇总: /merchant/commissions/summary API
 * - 使用 merchant.commissions i18n 命名空间
 *
 * 佣金类型说明:
 * - ACCRUED: 应计佣金（订单完成后应计入，尚未结算）
 * - SETTLED: 已结算佣金（已支付给经销商）
 *
 * 查询参数:
 * - page/limit: 分页参数
 * - distributorId: 按经销商筛选
 * - status: 按佣金状态筛选
 * - from/to: 日期范围筛选
 */
import { getLocale, getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { BentoListHeader, EmptyState, ListPageFrame, formatMoney } from '@meridian/ui';
import { LedgerStatus, type CommissionListQuery } from '@meridian/shared';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import {
  apiFetch,
  asList,
  type Distributor,
  type OnboardingProfile,
  type PaginatedResponse,
} from '@/lib/api';
import { getToken } from '@/lib/auth';
import {
  defaultDateRange,
  fetchCommissionSummary,
  fetchCommissions,
} from '@/lib/commissions';
import { CommissionsFilters } from './_components/commissions-filters';
import { CommissionsTable } from './_components/commissions-table';

/**
 * 页面 Props 类型定义
 *
 * @property searchParams - URL 查询参数，包含分页、筛选条件等
 */
interface CommissionsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * 解析 URL 查询参数为佣金查询对象
 *
 * @param params - URL searchParams 解析后的对象
 * @returns CommissionListQuery 类型的查询参数
 *
 * 参数转换:
 * - page/limit: 字符串转数字，默认为 1/20
 * - distributorId: 直接传递或 undefined
 * - status: 只接受 ACCRUED 或 SETTLED，其他为 undefined
 * - from/to: 使用默认日期范围（最近30天）
 *
 * 默认日期范围:
 * - 使用 lib/commissions 的 defaultDateRange() 函数
 * - 保证每次查询都有合理的时间范围
 */
function parseQuery(
  params: Record<string, string | string[] | undefined>,
): CommissionListQuery {
  // 获取默认日期范围（最近30天）
  const defaults = defaultDateRange();

  // 辅助函数：安全获取字符串参数
  const str = (key: string) => {
    const v = params[key];
    return typeof v === 'string' ? v : undefined;
  };

  const page = str('page');
  const limit = str('limit');
  const status = str('status');

  return {
    // 分页参数，默认第1页，每页20条
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 20,
    // 经销商筛选（可选）
    distributorId: str('distributorId'),
    // 佣金状态筛选（只接受有效枚举值）
    status:
      status === LedgerStatus.ACCRUED || status === LedgerStatus.SETTLED ? status : undefined,
    // 日期范围（使用默认值）
    from: str('from') ?? defaults.from,
    to: str('to') ?? defaults.to,
  };
}

/**
 * 佣金账本页面主组件
 *
 * 页面布局:
 * - MerchantShellWrapper: 商户门户框架
 * - BentoListHeader: 顶部指标卡片
 * - ListPageFrame: 列表页面框架
 *
 * 核心功能:
 * 1. 数据并行加载
 *    - commissionsRes: 佣金记录列表（分页）
 *    - summaryRes: 佣金汇总数据
 *    - profile: 商户基本资料
 *
 * 2. 指标卡片
 *    - accrued: 应计佣金总额
 *    - settled: 已结算佣金总额
 *    - totalCommission: 佣金总金额
 *    - entries: 佣金条目数量
 *
 * 3. CommissionsTable 子组件
 *    - 渲染佣金记录表格
 *
 * 4. CommissionsFilters 子组件
 *    - 提供筛选器 UI（当前传入空数组，后续可扩展）
 *
 * @param searchParams - URL 查询参数（Promise）
 */
export default async function CommissionsPage({ searchParams }: CommissionsPageProps) {
  const locale = await getLocale();
  const t = await getTranslations('merchant.commissions');
  const tSummary = await getTranslations('merchant.commissions.summary');
  const token = await getToken();
  if (!token) return null;

  const rawParams = await searchParams;
  const query = parseQuery(rawParams);

  const [commissionsRes, summaryRes, profile] = await Promise.all([
    fetchCommissions(token, query).catch(() => ({
      items: [],
      total: 0,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    })),
    fetchCommissionSummary(token, {
      distributorId: query.distributorId,
      status: query.status,
      from: query.from,
      to: query.to,
    }).catch(() => ({
      accruedTotal: 0,
      settledTotal: 0,
      totalCommission: 0,
      entryCount: 0,
      from: query.from ?? defaultDateRange().from,
      to: query.to ?? defaultDateRange().to,
    })),
    apiFetch<OnboardingProfile>('/merchant/onboarding', {}, token).catch(() => null),
  ]);

  const isEmpty = commissionsRes.items.length === 0;

  return (
    <MerchantShellWrapper businessName={profile?.businessName}>
      <ListPageFrame
        title={t('title')}
        description={t('description')}
        filters={
          <Suspense fallback={null}>
            <CommissionsFilters distributors={[]} />
          </Suspense>
        }
        emptyState={
          isEmpty ? (
            <EmptyState title={t('emptyTitle')} description={t('emptyDescription')} />
          ) : undefined
        }
      >
        <div className="space-y-6">
          <BentoListHeader
            metrics={[
              { title: tSummary('accrued'), value: formatMoney(summaryRes.accruedTotal, locale) },
              { title: tSummary('settled'), value: formatMoney(summaryRes.settledTotal, locale) },
              {
                title: tSummary('totalCommission'),
                value: formatMoney(summaryRes.totalCommission, locale),
              },
              { title: tSummary('entries'), value: summaryRes.entryCount },
            ]}
          />
          <CommissionsTable items={commissionsRes.items} />
        </div>
      </ListPageFrame>
    </MerchantShellWrapper>
  );
}
