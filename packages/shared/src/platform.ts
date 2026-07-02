import type { MerchantDistributorSummary } from './distributors.js';

/**
 * 驳回商户请求
 * 平台管理员拒绝商户入驻申请时填写的原因
 * @property reason - 拒绝原因说明
 */
export interface RejectMerchantRequest {
  reason: string;
}

export interface MerchantCrmSummary {
  contacts: number;
  companies: number;
  leads: number;
}

export interface PlatformRecentMerchant {
  id: string;
  businessName: string;
  contactEmail: string;
  onboardingStatus: string;
  submittedAt?: string;
}

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
