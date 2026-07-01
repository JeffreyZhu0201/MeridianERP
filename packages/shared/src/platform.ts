import type { MerchantDistributorSummary } from './distributors.js';

/**
 * 平台管理员 API 请求结构
 * 用于 UI 组件与 API 契约对齐 (G-1)
 */

/**
 * 驳回商户请求
 * 平台管理员拒绝商户入驻申请时填写的原因
 * @property reason - 拒绝原因说明
 */
export interface RejectMerchantRequest {
  reason: string;
}

/**
 * 商户 CRM 数据汇总
 * 在平台商户详情页展示关联的 CRM 数据统计
 * @property contacts - 关联联系人数量
 * @property companies - 关联公司数量
 * @property leads - 关联线索数量
 */
export interface MerchantCrmSummary {
  contacts: number;
  companies: number;
  leads: number;
}

/**
 * 平台近期商户摘要
 * 嵌入在平台管理后台仪表盘的商户列表行
 * @property id - 商户ID
 * @property businessName - 商户商业名称
 * @property contactEmail - 商户联系邮箱
 * @property onboardingStatus - 入驻状态
 * @property submittedAt - 提交审核时间
 */
export interface PlatformRecentMerchant {
  id: string;
  businessName: string;
  contactEmail: string;
  onboardingStatus: string;
  submittedAt?: string;
}

/**
 * 平台商户详情完整结构
 * 包含商户档案字段、关联经销商列表和 CRM 数据充实
 * @see GET /api/v1/platform/merchants/:id
 * @property id - 商户唯一标识
 * @property businessName - 商户商业名称
 * @property legalName - 商户法律实体名称
 * @property contactEmail - 主要联系邮箱
 * @property contactPhone - 联系手机号
 * @property onboardingStatus - 当前入驻状态
 * @property rejectionReason - 拒绝原因（如被拒绝）
 * @property submittedAt - 提交审核时间
 * @property reviewedAt - 审核完成时间
 * @property tenantId - 对应的租户ID
 * @property crmSummary - CRM 数据汇总统计
 * @property distributors - 关联的经销商摘要列表
 */
export interface PlatformMerchantDetail {
  id: string;
  businessName: string;
  legalName?: string | null;
  contactEmail: string;
  contactPhone?: string | null;
  onboardingStatus: string;
  rejectionReason?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  tenantId: string;
  crmSummary: MerchantCrmSummary;
  distributors: MerchantDistributorSummary[];
}
