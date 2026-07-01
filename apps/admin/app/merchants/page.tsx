/**
 * 商户管理页面 - 商户列表
 *
 * 功能说明:
 * - 展示所有商户的列表信息，包括商户名称、状态、提交时间等
 * - 支持按状态（审核中、已批准、已拒绝等）筛选商户
 * - 支持搜索商户名称或相关关键词
 * - 分页展示商户数据，每页20条
 *
 * 使用场景:
 * - 平台管理员查看和审核商户入驻申请
 * - 管理商户的审批状态和基本信息
 * - 为商户分配或查看关联的经销商
 *
 * 数据来源:
 * - 商户列表: /platform/merchants API（支持分页和筛选）
 * - 经销商列表: /platform/distributors API（用于下拉选择关联经销商）
 * - 使用 admin.merchants i18n 命名空间
 */
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { BentoListHeader, EmptyState, ListPageFrame } from '@meridian/ui';
import { OnboardingStatus } from '@meridian/shared';

import { AdminShellWrapper } from '@/components/admin-shell-wrapper';
import { apiFetch, type PaginatedResponse, type MerchantListItem, type PlatformDistributor } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { MerchantsFilters } from './_components/merchants-filters';
import { MerchantsPagination } from './_components/merchants-pagination';
import { MerchantsTable } from './_components/merchants-table';

/**
 * 页面 Props 类型定义
 *
 * @property searchParams - URL 查询参数，包含:
 *   - status: 按商户审核状态筛选（如 "APPROVED", "PENDING_REVIEW"）
 *   - search: 搜索关键词，匹配商户名称
 *   - page: 当前页码，默认为 "1"
 *
 * 使用方式:
 * - 通过 Next.js 的服务端组件 props 接收 URL searchParams
 * - searchParams 是 Promise 类型，需要在服务端组件中 await
 */
interface MerchantsPageProps {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>;
}

/**
 * 商户列表页面主组件
 *
 * 页面布局:
 * - AdminShellWrapper: 提供管理门户的导航和布局框架
 * - BentoListHeader: 顶部指标区域，展示商户总数和当前筛选状态
 * - ListPageFrame: 列表页面框架，包含标题、描述、筛选器和表格
 *
 * 核心功能:
 * 1. 数据加载
 *    - 并行调用商户列表 API 和经销商列表 API
 *    - 商户列表支持分页（page, limit）、状态筛选（status）、搜索（search）
 *    - 经销商列表用于商户详情页的下拉选择
 *
 * 2. 状态转换（OnboardingStatus 枚举）
 *    - PENDING_REVIEW: 待审核 - 新提交的商户申请
 *    - APPROVED: 已批准 - 审核通过，可以正常运营
 *    - REJECTED: 已拒绝 - 审核未通过
 *    - SUSPENDED: 已暂停 - 被平台暂停服务
 *
 * 3. 指标卡片数据
 *    - totalMerchants: 符合筛选条件的商户总数
 *    - filterStatus: 当前选中的状态筛选标签
 *    - pageOf: 显示当前页码和总页数
 *
 * 错误处理:
 * - API 调用失败时， merchants 和 distributors 设为空数组
 * - 保证页面在 API 不可用时仍能正常渲染（显示空状态）
 *
 * @param searchParams - URL 查询参数对象（Promise）
 */
export default async function MerchantsPage({ searchParams }: MerchantsPageProps) {
  const token = await getToken();
  if (!token) return null;

  const t = await getTranslations('admin.merchants');
  const params = await searchParams;
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.search) query.set('search', params.search);
  query.set('page', params.page ?? '1');
  query.set('limit', '20');

  let merchants: MerchantListItem[] = [];
  let meta = { total: 0, page: 1, limit: 20 };
  let distributors: PlatformDistributor[] = [];
  try {
    const [res, distRes] = await Promise.all([
      apiFetch<PaginatedResponse<MerchantListItem>>(
        `/platform/merchants?${query.toString()}`,
        {},
        token,
      ),
      apiFetch<PlatformDistributor[]>('/platform/distributors', {}, token),
    ]);
    merchants = res.data;
    meta = res.meta;
    distributors = distRes;
  } catch {
    merchants = [];
  }

  const td = await getTranslations('admin.dashboard');
  const tc = await getTranslations('common');
  const statusFilter = params.status;
  const statusLabel =
    statusFilter && Object.values(OnboardingStatus).includes(statusFilter as OnboardingStatus)
      ? t(`onboardingStatus.${statusFilter as OnboardingStatus}`)
      : null;

  const metrics = [
    {
      title: td('totalMerchants'),
      value: meta.total,
      description: statusLabel ? `${t('filterStatus')}: ${statusLabel}` : undefined,
    },
  ];

  if (statusLabel) {
    metrics.push({
      title: statusLabel,
      value: meta.total,
      description: t('filterStatus'),
    });
  }

  metrics.push({
    title: tc('pageOf', {
      page: meta.page,
      total: Math.max(1, Math.ceil(meta.total / meta.limit)),
    }),
    value: merchants.length,
    description: undefined,
  });

  return (
    <AdminShellWrapper>
      <div className="space-y-6">
        <BentoListHeader metrics={metrics} />
        <ListPageFrame
          title={t('title')}
          description={t('description')}
          filters={
            <Suspense>
              <MerchantsFilters />
            </Suspense>
          }
          emptyState={
            merchants.length === 0 ? (
              <EmptyState title={t('empty')} description={t('emptyDescription')} />
            ) : undefined
          }
        >
          <MerchantsTable merchants={merchants} token={token} distributors={distributors} />
          <Suspense>
            <MerchantsPagination total={meta.total} page={meta.page} limit={meta.limit} />
          </Suspense>
        </ListPageFrame>
      </div>
    </AdminShellWrapper>
  );
}
