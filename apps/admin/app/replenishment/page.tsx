/**
 * 商户补货申请管理页面
 *
 * 功能说明:
 * - 展示商户提交的库存补货申请列表
 * - 默认只显示待处理（PENDING）状态的申请
 * - 统计待处理补货申请的数量
 * - 支持管理员审核通过或拒绝补货申请
 *
 * 使用场景:
 * - 平台运营人员处理商户的补货请求
 * - 根据商户配额和库存情况审批补货申请
 * - 跟踪补货进度和历史记录
 *
 * 数据来源:
 * - 补货申请列表: /platform/replenishment?status=PENDING API
 * - 使用 admin.replenishment i18n 命名空间
 *
 * 业务说明:
 * - 补货申请是商户向平台申请增加 SKU 配额的过程
 * - 申请状态: PENDING（待处理）→ APPROVED（已批准）/ REJECTED（已拒绝）
 * - 批准后平台增加该商户的 SKU 配额
 */
import { getTranslations } from 'next-intl/server';
import { BentoListHeader, ListPageFrame } from '@meridian/ui';

import { AdminShellWrapper } from '@/components/admin-shell-wrapper';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { ReplenishmentView } from './_components/replenishment-view';

/**
 * 补货申请行数据类型
 *
 * @property id - 补货申请唯一标识
 * @property status - 申请状态（PENDING/APPROVED/REJECTED）
 * @property note - 商户填写的备注说明
 * @property rejectionReason - 拒绝原因（如果被拒绝）
 * @property createdAt - 申请创建时间
 * @property tenant - 申请商户信息
 * @property lines - 补货商品明细列表
 *
 * tenant 包含:
 * - merchantProfile.businessName: 商户企业名称
 * - slug: 商户商店 slug
 *
 * lines 数组每项包含:
 * - quantity: 申请补货数量
 * - masterSku.skuCode: 商品 SKU 代码
 * - masterSku.name: 商品名称
 */
export interface ReplenishmentRequestRow {
  id: string;
  status: string;
  note: string | null;
  rejectionReason: string | null;
  createdAt: string;
  tenant: {
    merchantProfile: { businessName: string } | null;
    slug: string;
  };
  lines: Array<{
    quantity: number;
    masterSku: { skuCode: string; name: string };
  }>;
}

/**
 * 补货申请页面主组件
 *
 * 页面布局:
 * - AdminShellWrapper: 管理门户框架
 * - BentoListHeader: 顶部指标卡片（显示待处理申请数量）
 * - ListPageFrame: 列表页面框架
 *
 * 核心功能:
 * 1. 申请筛选
 *    - 默认只加载 PENDING（待处理）状态的申请
 *    - 已处理的申请不在此页面展示
 *
 * 2. 指标卡片
 *    - 显示当前待处理的补货申请数量
 *
 * 3. ReplenishmentView 子组件
 *    - 渲染补货申请列表
 *    - 支持查看申请详情、批准或拒绝操作
 */
export default async function ReplenishmentPage() {
  const token = await getToken();
  if (!token) return null;

  const t = await getTranslations('admin.replenishment');

  let requests: ReplenishmentRequestRow[] = [];
  try {
    requests = await apiFetch<ReplenishmentRequestRow[]>(
      '/platform/replenishment?status=PENDING',
      {},
      token,
    );
  } catch {
    requests = [];
  }

  return (
    <AdminShellWrapper>
      <div className="space-y-6">
        <BentoListHeader metrics={[{ title: t('title'), value: requests.length }]} />
        <ListPageFrame title={t('title')} description={t('description')}>
          <ReplenishmentView requests={requests} token={token} />
        </ListPageFrame>
      </div>
    </AdminShellWrapper>
  );
}
