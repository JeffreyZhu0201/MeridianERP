export const EMAIL_QUEUE = 'email' as const;
export const ORDER_QUEUE = 'orders' as const;

export const EmailJobName = {
  MERCHANT_WELCOME: 'merchant.welcome',
  MERCHANT_REJECTED: 'merchant.rejected',
  COMMISSION_ACCRUED: 'commission.accrued',
  ORDER_CONFIRMATION: 'order.confirmation',
} as const;

export type EmailJobNameValue = (typeof EmailJobName)[keyof typeof EmailJobName];

export interface MerchantWelcomeEmailPayload {
  email: string;
  businessName: string;
}

export interface MerchantRejectedEmailPayload {
  email: string;
  reason: string;
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

export const OrderJobName = {
  EXPIRE_PENDING: 'orders.expire-pending',
  EXPIRE_ISSUED_ALLOCATIONS: 'orders.expire-issued-allocations',
  SETTLEMENT_REMINDER: 'orders.settlement-reminder',
} as const;

export const DEFAULT_QUEUE_ATTEMPTS = 3;

export const DEFAULT_QUEUE_BACKOFF_MS = 1000;
