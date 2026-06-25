import type { LeadStage } from './enums.js';

/** Recent lead row on merchant dashboard. */
export interface MerchantDashboardLead {
  id: string;
  title: string;
  stage: LeadStage | string;
  source?: string | null;
  updatedAt: string;
}

/** Recent binding or commission event on merchant dashboard (last 7 days). */
export interface MerchantDashboardActivity {
  type: 'binding.created' | 'commission.accrued';
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
  recentLeads: MerchantDashboardLead[];
  recentActivity: MerchantDashboardActivity[];
}
