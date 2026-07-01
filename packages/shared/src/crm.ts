import type { ActivityType } from './enums.js';

/**
 * CRM 客户关系管理相关类型定义
 * 用于商户与客户/线索交互活动记录
 */

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

/**
 * 创建 CRM 活动请求
 * @property type - 活动类型（必填）
 * @property note - 活动内容（必填）
 * @property contactId - 关联联系人ID（可选）
 * @property leadId - 关联线索ID（可选）
 * 注意：contactId 和 leadId 至少填写一个
 */
export interface CreateActivityRequest {
  type: ActivityType;
  note: string;
  contactId?: string;
  leadId?: string;
}

/**
 * 删除 CRM 活动响应
 * @property deleted - 确认删除成功的标志
 */
export interface DeleteActivityResponse {
  deleted: true;
}
