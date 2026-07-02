import type { LeadStage } from './enums.js';

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

export interface CreatePlatformCrmCompanyRequest {
  name: string;
  website?: string;
}

export interface UpdatePlatformCrmCompanyRequest {
  name?: string;
  website?: string;
}

export interface CreatePlatformCrmContactRequest {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  companyId?: string;
}

export interface UpdatePlatformCrmContactRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  companyId?: string | null;
}

export interface CreatePlatformCrmLeadRequest {
  title: string;
  contactId?: string;
  source?: string;
}

export interface UpdatePlatformCrmLeadRequest {
  title?: string;
  contactId?: string | null;
  source?: string;
  stage?: LeadStage;
}

export interface DeletePlatformCrmResponse {
  deleted: true;
}
