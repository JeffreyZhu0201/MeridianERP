import type { ActivityType } from './enums.js';

/**
 * CRM 活动记录
 * 记录与客户或线索的业务交互活动
 * @property id - 活动记录唯一标识
 * @property tenantId - 所属租户ID
 * @property contactId - 关联联系人ID（可为null）
 * @property leadId - 关联线索ID（可为null）
 * @property type - 活动类型（电话/备注/会议）
 * @property note - 活动内容详情
 * @property createdAt - 记录创建时间
 * @property contact - 关联联系人详情（如已关联）
 */
export interface CrmActivity {
  id: string;
  tenantId: string;
  contactId: string | null;
  leadId: string | null;
  type: ActivityType;
  note: string;
  createdAt: string;
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string | null;
  } | null;
}

export interface CreateActivityRequest {
  type: ActivityType;
  note: string;
  contactId?: string;
  leadId?: string;
}

export interface DeleteActivityResponse {
  deleted: true;
}

/** Merchant CRM: store customer with at least one fulfilled order */
export interface CrmStoreCustomerListItem {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  completedOrderCount: number;
  totalSpent: string | number;
  lastOrderAt: string;
}
