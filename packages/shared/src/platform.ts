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
  pendingRecruitInviteCode?: string | null;
  pendingRecruiterId?: string | null;
  pendingRecruiterName?: string | null;
  recruitedByDistributorId?: string | null;
  recruitedByDistributorName?: string | null;
  storePublished: boolean;
  isFlagship: boolean;
  crmSummary: MerchantCrmSummary;
  distributors: MerchantDistributorSummary[];
}

export type UserIdentity =
  | 'CONSUMER'
  | 'MERCHANT_OWNER'
  | 'MERCHANT_STAFF'
  | 'DISTRIBUTOR'
  | 'PLATFORM_ADMIN';

export interface PlatformAccountSummary {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  createdAt: string;
}

export interface PlatformAccountListItem extends PlatformAccountSummary {
  identities: UserIdentity[];
  merchantNames: string[];
}

export interface PlatformAccountConsumerProfile {
  customerId: string;
  tenantId: string;
  tenantSlug: string;
  businessName: string;
  orderCount: number;
}

export interface PlatformAccountMerchantRole {
  userId: string;
  tenantId: string;
  tenantSlug: string;
  businessName: string;
  role: string;
  onboardingStatus: string;
}

export interface PlatformAccountDetail extends PlatformAccountListItem {
  consumerProfiles: PlatformAccountConsumerProfile[];
  merchantRoles: PlatformAccountMerchantRole[];
  /** Present when the account has an active platform admin identity */
  platformAdminRole?: 'SUPER_ADMIN' | 'PLATFORM_OPS' | null;
  /** Present when the account has an active distributor identity (decimal rate, e.g. 0.1 = 10%) */
  distributorCommissionRate?: number | null;
}

export interface CreatePlatformMerchantRequest {
  businessName: string;
  legalName?: string;
  contactEmail: string;
  contactPhone?: string;
  slug?: string;
  ownerAccountId: string;
  recruitedByDistributorId?: string;
  autoApprove?: boolean;
}

export interface UpdatePlatformAccountRequest {
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
}

export interface UpdatePlatformAccountIdentitiesRequest {
  platformAdminRole?: 'SUPER_ADMIN' | 'PLATFORM_OPS' | null;
  distributor?: { enabled: boolean; commissionRate?: number } | null;
  merchantStaff?: Array<{ tenantId: string; enabled: boolean }>;
}
