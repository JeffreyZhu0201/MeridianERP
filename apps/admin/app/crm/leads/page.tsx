/**
 * CRM 线索管理页面
 *
 * 功能说明:
 * - 展示平台所有商户录入的销售线索（Leads）
 * - 展示平台所有客户联系人（Contacts）
 * - 支持查看线索详情和关联的联系人
 * - 跟踪线索的销售阶段和转化情况
 *
 * 使用场景:
 * - 平台运营人员查看商户提交的线索数据
 * - 分析各商户的 CRM 数据质量
 * - 监控销售漏斗和转化率
 *
 * 数据来源:
 * - 线索列表: /platform/crm/leads API
 * - 联系人列表: /platform/crm/contacts API
 * - 使用 admin.crm.leads i18n 命名空间
 *
 * 数据模型说明:
 * - PlatformCrmLead: 销售线索，包含客户信息和销售阶段
 * - PlatformCrmContact: 联系人，包含联系方式和基本信息
 *
 * 线索销售阶段（LeadStage）:
 * - NEW: 新线索
 * - QUALIFIED: 已筛选（有需求）
 * - WON: 成交
 * - LOST: 失败
 */
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import type { PlatformCrmContact, PlatformCrmLead } from '@meridian/shared';
import { BentoListHeader, ListPageFrame } from '@meridian/ui';

import { AdminShellWrapper } from '@/components/admin-shell-wrapper';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { LeadsTable } from './_components/leads-table';

/**
 * CRM 线索页面主组件
 *
 * 页面布局:
 * - AdminShellWrapper: 管理门户框架
 * - BentoListHeader: 顶部指标卡片
 * - ListPageFrame: 列表页面框架
 *
 * 核心功能:
 * 1. 数据并行加载
 *    - leads: 线索列表
 *    - contacts: 联系人列表
 *    - 两个接口并行调用，提高加载速度
 *
 * 2. 指标卡片
 *    - 显示线索总数
 *    - 描述信息展示当前筛选条件
 *
 * 3. LeadsTable 子组件
 *    - 渲染线索表格
 *    - 支持关联联系人查看
 *    - 接收 token 用于后续操作
 *
 * 错误处理:
 * - 任意 API 失败时两个列表都设为空数组
 * - 保证页面仍能正常渲染（显示空状态）
 */
export default async function CrmLeadsPage() {
  const token = await getToken();
  if (!token) return null;

  const t = await getTranslations('admin.crm.leads');
  let leads: PlatformCrmLead[] = [];
  let contacts: PlatformCrmContact[] = [];
  try {
    [leads, contacts] = await Promise.all([
      apiFetch<PlatformCrmLead[]>('/platform/crm/leads', {}, token),
      apiFetch<PlatformCrmContact[]>('/platform/crm/contacts', {}, token),
    ]);
  } catch {
    leads = [];
    contacts = [];
  }

  return (
    <AdminShellWrapper>
      <div className="space-y-6">
        <BentoListHeader
          metrics={[{ title: t('title'), value: leads.length, description: t('description') }]}
        />
        <ListPageFrame title={t('title')} description={t('description')}>
          <Suspense>
            <LeadsTable leads={leads} contacts={contacts} token={token} />
          </Suspense>
        </ListPageFrame>
      </div>
    </AdminShellWrapper>
  );
}
