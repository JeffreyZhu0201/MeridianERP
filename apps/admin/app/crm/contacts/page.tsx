/**
 * CRM 联系人管理页面
 *
 * 功能说明:
 * - 展示平台所有商户录入的联系人信息
 * - 显示联系人姓名、邮箱、电话等基本信息
 * - 支持关联查看联系人所属公司
 *
 * 使用场景:
 * - 平台运营人员查看商户录入的联系人数据
 * - 查看联系人详细信息和关联公司
 * - 分析客户联系信息完整性
 *
 * 数据来源:
 * - 联系人列表: /platform/crm/contacts API
 * - 公司列表: /platform/crm/companies API（用于关联显示）
 * - 使用 admin.crm.contacts i18n 命名空间
 *
 * 数据模型说明:
 * - PlatformCrmContact: 联系人实体，包含姓名、联系方式等
 * - PlatformCrmCompany: 公司实体，用于关联显示
 */
import { getTranslations } from 'next-intl/server';
import type { PlatformCrmCompany, PlatformCrmContact } from '@meridian/shared';
import { BentoListHeader, ListPageFrame } from '@meridian/ui';

import { AdminShellWrapper } from '@/components/admin-shell-wrapper';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { ContactsTable } from './_components/contacts-table';

/**
 * CRM 联系人页面主组件
 *
 * 页面布局:
 * - AdminShellWrapper: 管理门户框架
 * - BentoListHeader: 顶部指标卡片
 * - ListPageFrame: 列表页面框架
 *
 * 核心功能:
 * 1. 数据并行加载
 *    - contacts: 联系人列表
 *    - companies: 公司列表（用于关联显示）
 *    - 两个接口并行调用
 *
 * 2. 指标卡片
 *    - 显示联系人总数
 *    - 描述信息展示当前页面用途
 *
 * 3. ContactsTable 子组件
 *    - 渲染联系人表格
 *    - 支持查看联系人详情和关联公司
 *    - 接收 token 用于后续操作
 *
 * 错误处理:
 * - 任意 API 失败时两个列表都设为空数组
 * - 保证页面仍能正常渲染
 */
export default async function CrmContactsPage() {
  const token = await getToken();
  if (!token) return null;

  const t = await getTranslations('admin.crm.contacts');
  let contacts: PlatformCrmContact[] = [];
  let companies: PlatformCrmCompany[] = [];
  try {
    [contacts, companies] = await Promise.all([
      apiFetch<PlatformCrmContact[]>('/platform/crm/contacts', {}, token),
      apiFetch<PlatformCrmCompany[]>('/platform/crm/companies', {}, token),
    ]);
  } catch {
    contacts = [];
    companies = [];
  }

  return (
    <AdminShellWrapper>
      <div className="space-y-6">
        <BentoListHeader
          metrics={[{ title: t('title'), value: contacts.length, description: t('description') }]}
        />
        <ListPageFrame title={t('title')} description={t('description')}>
          <ContactsTable contacts={contacts} companies={companies} token={token} />
        </ListPageFrame>
      </div>
    </AdminShellWrapper>
  );
}