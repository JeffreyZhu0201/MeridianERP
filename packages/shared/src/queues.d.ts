export declare const EMAIL_QUEUE: "email";
export declare const ORDER_QUEUE: "orders";
export declare const EmailJobName: {
    readonly MERCHANT_WELCOME: "merchant.welcome";
    readonly MERCHANT_REJECTED: "merchant.rejected";
    readonly COMMISSION_ACCRUED: "commission.accrued";
    readonly ORDER_CONFIRMATION: "order.confirmation";
};
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
export declare const OrderJobName: {
    readonly EXPIRE_PENDING: "orders.expire-pending";
    readonly EXPIRE_ISSUED_ALLOCATIONS: "orders.expire-issued-allocations";
    readonly SETTLEMENT_REMINDER: "orders.settlement-reminder";
};
export declare const DEFAULT_QUEUE_ATTEMPTS = 3;
export declare const DEFAULT_QUEUE_BACKOFF_MS = 1000;
