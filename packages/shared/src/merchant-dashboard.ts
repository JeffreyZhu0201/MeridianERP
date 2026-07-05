import type { LeadStage } from './enums.js';
import type { PerformanceTrendPoint } from './distributors.js';

/**
 * 商户近期线索摘要
 * 显示在商户仪表盘最近的线索记录
 * @property id - 线索ID
 * @property title - 线索标题/描述
 * @property stage - 当前阶段（使用 LeadStage 枚举）
 * @property source - 线索来源（如"官网表单"、"地推"等）
 * @property updatedAt - 最后更新时间
 */
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
