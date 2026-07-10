import type { CommissionType, LedgerStatus } from './enums.js';
export type FulfillmentType = 'PICKUP' | 'DELIVERY';
export type AllocationOrderStatus = 'DRAFT' | 'ISSUED' | 'CONFIRMED' | 'CANCELLED';
export type WithdrawalRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export interface PlatformDistributorSummary {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    accountId: string | null;
    accountEmail: string | null;
    commissionRate: string | number;
    commissionType: CommissionType;
    isActive: boolean;
    portalEnabled: boolean;
    recruitedMerchantCount: number;
    createdAt: string;
}
export interface CreatePlatformDistributorRequest {
    name?: string;
    email?: string;
    phone?: string;
    accountId?: string;
    commissionRate: number;
    commissionType?: CommissionType;
}
export interface UpdatePlatformDistributorRequest {
    name?: string;
    email?: string;
    phone?: string;
    commissionRate?: number;
    commissionType?: CommissionType;
    isActive?: boolean;
}
export interface MerchantRecruitInviteCodeResponse {
    id: string;
    code: string;
    distributorId: string;
    expiresAt: string | null;
    revokedAt: string | null;
    useCount: number;
    url: string;
}
export interface DistributorInviteCodeRow extends MerchantRecruitInviteCodeResponse {
    createdAt: string | null;
}
export interface ApproveMerchantRequest {
    recruitedByDistributorId?: string;
}
export interface DistributorBranchSummary {
    tenantId: string;
    merchantProfileId: string;
    businessName: string;
    slug: string;
    recruitedAt: string | null;
    salesLast30Days: string | number;
    orderCountLast30Days: number;
    lifetimeSales?: string | number;
    lifetimeOrderCount?: number;
    allocationOrderCount?: number;
    allocationWholesaleTotal?: number;
    lastAllocationAt?: string | null;
    confirmedAllocationCount?: number;
}
export interface DistributorBranchAllocationSummary {
    id: string;
    status: AllocationOrderStatus;
    issuedAt: string | null;
    confirmedAt: string | null;
    wholesaleTotal: number;
    lineCount: number;
    createdAt: string;
}
export interface DistributorCommissionEntry {
    id: string;
    orderId?: string | null;
    allocationOrderId?: string | null;
    tenantId: string;
    businessName: string;
    customerOrderSequence?: number | null;
    merchantAllocationSequence?: number | null;
    commissionSource?: string | null;
    orderTotal: string | number;
    amount: string | number;
    status: LedgerStatus;
    fulfilledAt: string | null;
    createdAt: string;
}
export interface DistributorCommissionEntriesResponse {
    items: DistributorCommissionEntry[];
    total: number;
    page: number;
    limit: number;
}
export interface InviteCodePreview {
    code: string;
    promoterName: string;
}
export interface StoreMerchantApplicationRequest {
    inviteCode?: string;
    businessName: string;
    legalName?: string;
    contactPhone?: string;
}
export interface StoreMerchantApplicationStatus {
    id: string;
    businessName: string;
    onboardingStatus: string;
    submittedAt: string | null;
    pendingRecruitInviteCode: string | null;
}
export interface WithdrawalRequestRow {
    id: string;
    distributorId: string;
    distributorName: string;
    distributorEmail?: string | null;
    amount: string | number;
    status: WithdrawalRequestStatus;
    note: string | null;
    rejectionReason: string | null;
    reviewedAt: string | null;
    payoutProvider?: string | null;
    payoutReference?: string | null;
    disbursedAt?: string | null;
    payoutError?: string | null;
    createdAt: string;
}
export interface WithdrawalListQuery {
    status?: WithdrawalRequestStatus;
    distributorId?: string;
    page?: number;
    limit?: number;
}
export interface PaginatedWithdrawalList {
    data: WithdrawalRequestRow[];
    meta: {
        total: number;
        page: number;
        limit: number;
    };
}
export interface CreateWithdrawalRequest {
    amount: number;
    note?: string;
}
export interface DistributorFundsSummary {
    accruedTotal: string | number;
    settledTotal: string | number;
    pendingWithdrawals: string | number;
    availableBalance: string | number;
    branchCount: number;
}
