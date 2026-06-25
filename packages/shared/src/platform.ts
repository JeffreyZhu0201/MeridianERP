import type { MerchantDistributorSummary } from './distributors.js';

/** Platform admin API request bodies — UI contract alignment (G-1). */
export interface RejectMerchantRequest {
  reason: string;
}

/** CRM entity counts on platform merchant detail (G-4 / US-4.5). */
export interface MerchantCrmSummary {
  contacts: number;
  companies: number;
  leads: number;
}

/** Recent merchant row embedded in platform dashboard (US-4.5). */
export interface PlatformRecentMerchant {
  id: string;
  businessName: string;
  contactEmail: string;
  onboardingStatus: string;
  submittedAt?: string;
}

/**
 * Platform admin merchant detail — profile fields plus distributor and CRM enrichment.
 * @see GET /api/v1/platform/merchants/:id
 */
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
  crmSummary: MerchantCrmSummary;
  distributors: MerchantDistributorSummary[];
}
