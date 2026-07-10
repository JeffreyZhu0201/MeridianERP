import type { PerformanceTrendPoint } from './distributors.js';
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
    tenantId: string;
    businessName: string;
    contactEmail: string;
    onboardingStatus: string;
    submittedAt?: string | null;
    createdAt?: string;
    storePublished?: boolean;
    isFlagship?: boolean;
    slug?: string;
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
    ownerAccountId?: string | null;
    pendingRecruitInviteCode?: string | null;
    pendingRecruiterId?: string | null;
    pendingRecruiterName?: string | null;
    recruitedByDistributorId?: string | null;
    recruitedByDistributorName?: string | null;
    storePublished: boolean;
    operationalFrozen?: boolean;
    isFlagship: boolean;
    crmSummary: MerchantCrmSummary;
}
export interface PlatformMerchantStatisticsOrder {
    id: string;
    total: string;
    status: string;
    createdAt: string;
}
export interface PlatformMerchantStatistics {
    ordersLast30Days: number;
    revenueLast30Days: string;
    productCount: number;
    skuCount: number;
    totalUnitsOnHand: number;
    lowStockCount: number;
    trend: PerformanceTrendPoint[];
    recentOrders: PlatformMerchantStatisticsOrder[];
}
export type UserIdentity = 'CONSUMER' | 'MERCHANT_OWNER' | 'MERCHANT_STAFF' | 'DISTRIBUTOR' | 'PLATFORM_ADMIN';
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
    platformAdminRole?: 'SUPER_ADMIN' | 'FINANCE' | 'FULFILLMENT' | 'REVIEWER' | null;
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
    platformAdminRole?: 'SUPER_ADMIN' | 'FINANCE' | 'FULFILLMENT' | 'REVIEWER' | null;
    distributor?: {
        enabled: boolean;
        commissionRate?: number;
    } | null;
    merchantStaff?: Array<{
        tenantId: string;
        enabled: boolean;
    }>;
}
