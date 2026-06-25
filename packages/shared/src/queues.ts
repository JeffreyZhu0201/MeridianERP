/** BullMQ queue names. */
export const EMAIL_QUEUE = 'email' as const;
export const COMMISSION_QUEUE = 'commission' as const;

/** Email queue job names. */
export const EmailJobName = {
  MERCHANT_WELCOME: 'merchant.welcome',
  MERCHANT_REJECTED: 'merchant.rejected',
  DISTRIBUTOR_BINDING_CREATED: 'distributor.binding.created',
  COMMISSION_ACCRUED: 'commission.accrued',
  ORDER_CONFIRMATION: 'order.confirmation',
} as const;

export type EmailJobNameValue = (typeof EmailJobName)[keyof typeof EmailJobName];

/** Commission queue job names. */
export const CommissionJobName = {
  ORDER_ACCRUE: 'order.accrue',
} as const;

export interface MerchantWelcomeEmailPayload {
  email: string;
  businessName: string;
}

export interface MerchantRejectedEmailPayload {
  email: string;
  reason: string;
}

export interface BindingCreatedEmailPayload {
  tenantId: string;
  distributorId: string;
  bindType: string;
  boundAt: string;
}

export interface CommissionAccruedEmailPayload {
  tenantId: string;
  orderId: string;
  distributorId: string;
  amount: string;
}

export interface OrderConfirmationEmailPayload {
  tenantId: string;
  orderId: string;
  email: string;
}

export interface CommissionAccrueJobPayload {
  orderId: string;
}

export const DEFAULT_QUEUE_ATTEMPTS = 3;
export const DEFAULT_QUEUE_BACKOFF_MS = 1000;
