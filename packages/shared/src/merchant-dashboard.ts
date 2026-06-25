import type { LeadStage } from './enums.js';
import type { PerformanceTrendPoint } from './distributors.js';

/** Recent lead row on merchant dashboard. */
export interface MerchantDashboardLead {
  id: string;
  title: string;
  stage: LeadStage | string;
  source?: string | null;
  updatedAt: string;
}

/** Recent binding, commission, or order event on merchant dashboard. */
export interface MerchantDashboardActivity {
  type: 'binding.created' | 'commission.accrued' | 'order.paid';
  occurredAt: string;
  distributorId: string;
  distributorName: string;
  bindType?: string;
  orderId?: string;
  amount?: string;
}

/**
 * Merchant portal home dashboard aggregates.
 * @see GET /api/v1/merchant/dashboard
 */
export interface MerchantDashboardStats {
  businessName: string;
  contactsCount: number;
  openLeads: number;
  activeDistributors: number;
  recentBindings: number;
  ordersLast30Days: number;
  revenueLast30Days: string | number;
  commissionAccruedLast30Days: string | number;
  lowStockCount: number;
  trend: PerformanceTrendPoint[];
  recentLeads: MerchantDashboardLead[];
  recentActivity: MerchantDashboardActivity[];
}
