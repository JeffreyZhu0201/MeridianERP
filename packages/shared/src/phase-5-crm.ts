import type { LeadStage } from './enums.js';

/**
 * Phase 5 平台 CRM 相关类型定义
 * 平台管理员管理全局客户、公司和线索数据
 */

/**
 * 平台公司实体
 * 平台级别的公司/企业客户信息
 * @property id - 公司ID
 * @property name - 公司名称
 * @property website - 公司官网（可选）
 * @property createdAt - 创建时间
 * @property updatedAt - 更新时间
 * @property _count - 关联的联系人数量（可选）
 */
export interface PlatformCrmCompany {
  id: string;
  name: string;
  website: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { contacts: number };
}

/**
 * 平台联系人实体
 * 平台级别的联系人（关联到公司或个人）
 * @property id - 联系人ID
 * @property companyId - 所属公司ID（可选）
 * @property firstName - 名
 * @property lastName - 姓
 * @property email - 邮箱（可选）
 * @property phone - 电话（可选）
 * @property createdAt - 创建时间
 * @property updatedAt - 更新时间
 * @property company - 所属公司信息（可选）
 */
export interface PlatformCrmContact {
  id: string;
  companyId: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
  company?: { id: string; name: string } | null;
}

/**
 * 平台线索实体
 * 平台级别的销售线索
 * @property id - 线索ID
 * @property contactId - 关联联系人ID（可选）
 * @property title - 线索标题/描述
 * @property stage - 当前阶段
 * @property source - 线索来源
 * @property createdAt - 创建时间
 * @property updatedAt - 更新时间
 * @property contact - 关联联系人详情（可选）
 */
export interface PlatformCrmLead {
  id: string;
  contactId: string | null;
  title: string;
  stage: LeadStage;
  source: string | null;
  createdAt: string;
  updatedAt: string;
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string | null;
  } | null;
}

/**
 * 创建平台公司请求
 * @property name - 公司名称（必填）
 * @property website - 公司官网（可选）
 */
export interface CreatePlatformCrmCompanyRequest {
  name: string;
  website?: string;
}

/**
 * 更新平台公司请求
 * @property name - 公司名称（可选）
 * @property website - 公司官网（可选）
 */
export interface UpdatePlatformCrmCompanyRequest {
  name?: string;
  website?: string;
}

/**
 * 创建平台联系人请求
 * @property firstName - 名（必填）
 * @property lastName - 姓（必填）
 * @property email - 邮箱（可选）
 * @property phone - 电话（可选）
 * @property companyId - 所属公司ID（可选）
 */
export interface CreatePlatformCrmContactRequest {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  companyId?: string;
}

/**
 * 更新平台联系人请求
 * @property firstName - 名（可选）
 * @property lastName - 姓（可选）
 * @property email - 邮箱（可选）
 * @property phone - 电话（可选）
 * @property companyId - 所属公司ID（可选，可传null解除关联）
 */
export interface UpdatePlatformCrmContactRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  companyId?: string | null;
}

/**
 * 创建平台线索请求
 * @property title - 线索标题（必填）
 * @property contactId - 关联联系人ID（可选）
 * @property source - 线索来源（可选）
 */
export interface CreatePlatformCrmLeadRequest {
  title: string;
  contactId?: string;
  source?: string;
}

/**
 * 更新平台线索请求
 * @property title - 线索标题（可选）
 * @property contactId - 关联联系人ID（可选，可传null解除关联）
 * @property source - 线索来源（可选）
 * @property stage - 所处阶段（可选）
 */
export interface UpdatePlatformCrmLeadRequest {
  title?: string;
  contactId?: string | null;
  source?: string;
  stage?: LeadStage;
}

/**
 * 删除 CRM 实体响应
 * @property deleted - 确认删除成功的标志
 */
export interface DeletePlatformCrmResponse {
  deleted: true;
}
