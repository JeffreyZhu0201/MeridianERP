import type { CommissionType, MerchantRole } from './enums.js';
export interface MerchantProfileSettings {
    businessName: string;
    legalName?: string | null;
    contactEmail: string;
    contactPhone?: string | null;
    storeAddress?: string | null;
    isFlagship?: boolean;
}
export interface TenantSettingsDto {
    tenantId: string;
    defaultCommissionRate: string | number | null;
    defaultCommissionType: CommissionType | null;
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
    legalName?: string | null;
    contactEmail?: string;
    contactPhone?: string;
    storeAddress?: string | null;
    defaultCommissionRate?: number | string | null;
    defaultCommissionType?: CommissionType | null;
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
