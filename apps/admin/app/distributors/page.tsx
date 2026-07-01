/**
 * 渠道经销商管理页面
 *
 * 功能说明:
 * - 展示平台所有渠道经销商的列表
 * - 查看经销商的基本信息和状态
 * - 管理经销商的账户和绑定关系
 * - 支持创建新的经销商账户
 *
 * 使用场景:
 * - 平台管理员管理渠道经销商账户
 * - 查看经销商招募分店的数据
 * - 监控经销商的业绩和佣金结算情况
 *
 * 数据来源:
 * - 经销商列表: /platform/distributors API
 * - 使用 admin.distributors i18n 命名空间
 *
 * 业务说明:
 * - 渠道经销商是平台的 B2B 合作伙伴
 * - 经销商可以招募商户建立绑定关系
 * - 通过绑定关系，经销商获得商户订单的佣金分成
 *
 * 经销商角色特点:
 * - 独立 JWT 密钥认证
 * - 拥有专属的经销商门户
 * - 可查看招募分店的业绩数据
 */
import { getTranslations } from 'next-intl/server';
import { BentoListHeader, EmptyState, ListPageFrame } from '@meridian/ui';

import { AdminShellWrapper } from '@/components/admin-shell-wrapper';
import { apiFetch, type PlatformDistributor } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { DistributorsTable } from './_components/distributors-table';

/**
 * 渠道经销商页面主组件
 *
 * 页面布局:
 * - AdminShellWrapper: 管理门户框架
 * - BentoListHeader: 顶部指标卡片
 * - ListPageFrame: 列表页面框架
 *
 * 核心功能:
 * 1. 经销商数据加载
 *    - 调用 /platform/distributors API 获取经销商列表
 *    - 错误时降级为空数组
 *
 * 2. 指标卡片
 *    - 显示经销商总数
 *    - 描述信息说明当前列表范围
 *
 * 3. DistributorsTable 子组件
 *    - 渲染经销商表格
 *    - 支持查看详情、编辑等操作
 *    - 接收 token 用于后续操作
 */
export default async function DistributorsPage() {
  const token = await getToken();
  if (!token) return null;

  const t = await getTranslations('admin.distributors');
  let distributors: PlatformDistributor[] = [];
  try {
    distributors = await apiFetch<PlatformDistributor[]>('/platform/distributors', {}, token);
  } catch {
    distributors = [];
  }

  return (
    <AdminShellWrapper>
      <div className="space-y-6">
        <BentoListHeader
          metrics={[{ title: t('title'), value: distributors.length, description: t('description') }]}
        />
        <ListPageFrame
          title={t('title')}
          description={t('description')}
          emptyState={
            distributors.length === 0 ? (
              <EmptyState title={t('empty')} description={t('emptyDescription')} />
            ) : undefined
          }
        >
          <DistributorsTable distributors={distributors} token={token} />
        </ListPageFrame>
      </div>
    </AdminShellWrapper>
  );
}
