import type { LeadStage } from './enums.js';
import type { PerformanceTrendPoint } from './distributors.js';
export interface MerchantDashboardLead {
    id: string;
    title: string;
    stage: LeadStage | string;
    source?: string | null;
    updatedAt: string;
}
export interface MerchantDashboardActivity {
    type: 'commission.accrued' | 'order.paid';
    occurredAt: string;
    distributorId?: string;
    distributorName?: string;
    orderId?: string;
    amount?: string;
}
export interface MerchantDashboardStats {
    businessName: string;
    contactsCount: number;
    openLeads: number;
    ordersLast30Days: number;
    revenueLast30Days: string | number;
    commissionAccruedLast30Days: string | number;
    lowStockCount: number;
    trend: PerformanceTrendPoint[];
    recentLeads: MerchantDashboardLead[];
    recentActivity: MerchantDashboardActivity[];
}
