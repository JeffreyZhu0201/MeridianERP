import type { CommissionType, MerchantRole } from './enums.js';

/**
 * 商户档案资料
 * 商户企业基本信息
 * @property businessName - 商户商业名称
 * @property legalName - 法律实体名称（可选）
 * @property contactEmail - 主要联系邮箱
 * @property contactPhone - 联系手机号（可选）
 */
export interface MerchantProfileSettings {
  businessName: string;
  legalName?: string | null;
  contactEmail: string;
  contactPhone?: string | null;
}

export interface TenantSettingsDto {
  tenantId: string;
  defaultCommissionRate: string | number | null;
  defaultCommissionType: CommissionType | null;
  notifyOnBinding: boolean;
  notifyOnCommission: boolean;
  updatedAt: string;
}

export interface MerchantSettingsDto extends TenantSettingsDto {
  profile: MerchantProfileSettings;
  storeUrl: string;
  stripeMode: 'mock' | 'live';
}

export interface UpdateMerchantSettingsRequest {
  businessName?: string;
  contactEmail?: string;
  contactPhone?: string;
  defaultCommissionRate?: number | string | null;
  defaultCommissionType?: CommissionType | null;
  notifyOnBinding?: boolean;
  notifyOnCommission?: boolean;
}

export interface TeamMember {
  id: string;
  email: string;
  role: MerchantRole;
  createdAt: string;
}

export interface CreateTeamMemberRequest {
  email: string;
  password: string;
}

export interface UpdateTeamMemberRequest {
  password: string;
}

export interface PlatformSettingsDto {
  id: string;
  platformName: string;
  supportEmail: string | null;
  distributorPortalEnabled: boolean;
  emailQueueEnabled: boolean;
  updatedAt: string;
  stripeMode: 'mock' | 'live';
  stripeKeyHint: string | null;
  webhookUrl: string;
}

export interface UpdatePlatformSettingsRequest {
  platformName?: string;
  supportEmail?: string;
  distributorPortalEnabled?: boolean;
  emailQueueEnabled?: boolean;
}
