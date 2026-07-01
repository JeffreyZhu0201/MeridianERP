/**
 * CRM 公司管理页面
 *
 * 功能说明:
 * - 展示平台所有商户录入的公司信息
 * - 显示公司名称、网站等基本信息
 * - 支持关联查看公司下的联系人
 *
 * 使用场景:
 * - 平台运营人员查看商户录入的公司数据
 * - 查看公司详细信息和关联联系人
 * - 分析客户公司信息完整性
 *
 * 数据来源:
 * - 公司列表: /platform/crm/companies API
 * - 使用 admin.crm.companies i18n 命名空间
 *
 * 数据模型说明:
 * - PlatformCrmCompany: 公司实体，包含名称、网站等
 */
import { getTranslations } from 'next-intl/server';
import type { PlatformCrmCompany } from '@meridian/shared';
import { BentoListHeader, ListPageFrame } from '@meridian/ui';

import { AdminShellWrapper } from '@/components/admin-shell-wrapper';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { CompaniesTable } from './_components/companies-table';

/**
 * CRM 公司页面主组件
 *
 * 页面布局:
 * - AdminShellWrapper: 管理门户框架
 * - BentoListHeader: 顶部指标卡片
 * - ListPageFrame: 列表页面框架
 *
 * 核心功能:
 * 1. 公司数据加载
 *    - 调用 /platform/crm/companies API 获取公司列表
 *    - 错误时使用空数组降级
 *
 * 2. 指标卡片
 *    - 显示公司总数
 *    - 描述信息展示当前页面用途
 *
 * 3. CompaniesTable 子组件
 *    - 渲染公司表格
 *    - 支持查看公司详情和关联联系人
 *    - 接收 token 用于后续操作
 *
 * 错误处理:
 * - API 失败时使用空数组，保证页面正常渲染
 */
export default async function CrmCompaniesPage() {
  const token = await getToken();
  if (!token) return null;

  const t = await getTranslations('admin.crm.companies');
  let companies: PlatformCrmCompany[] = [];
  try {
    companies = await apiFetch<PlatformCrmCompany[]>('/platform/crm/companies', {}, token);
  } catch {
    companies = [];
  }

  return (
    <AdminShellWrapper>
      <div className="space-y-6">
        <BentoListHeader
          metrics={[{ title: t('title'), value: companies.length, description: t('description') }]}
        />
        <ListPageFrame title={t('title')} description={t('description')}>
          <CompaniesTable companies={companies} token={token} />
        </ListPageFrame>
      </div>
    </AdminShellWrapper>
  );
}
