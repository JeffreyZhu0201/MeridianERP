import type { CommissionType, LedgerStatus } from './enums.js';

/**
 * 履约类型枚举
 * 订单商品/服务的交付方式
 * - PICKUP: 消费者到店自提
 * - DELIVERY: 商家配送到消费者地址
 */
export type FulfillmentType = 'PICKUP' | 'DELIVERY';

export type AllocationOrderStatus = 'DRAFT' | 'ISSUED' | 'CONFIRMED' | 'CANCELLED';

export type ReplenishmentRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'FULFILLED';

export type WithdrawalRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface PlatformDistributorSummary {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  commissionRate: string | number;
  commissionType: CommissionType;
  isActive: boolean;
  portalEnabled: boolean;
  recruitedMerchantCount: number;
  createdAt: string;
}

export interface CreatePlatformDistributorRequest {
  name: string;
  email?: string;
  phone?: string;
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
}

export interface WithdrawalRequestRow {
  id: string;
  distributorId: string;
  distributorName: string;
  amount: string | number;
  status: WithdrawalRequestStatus;
  note: string | null;
  rejectionReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
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
