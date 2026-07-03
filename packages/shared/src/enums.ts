export enum OnboardingStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum LeadStage {
  NEW = 'NEW',
  QUALIFIED = 'QUALIFIED',
  WON = 'WON',
  LOST = 'LOST',
}

export enum ActivityType {
  CALL = 'CALL',
  NOTE = 'NOTE',
  MEETING = 'MEETING',
}

export enum CommissionType {
  PERCENT = 'PERCENT',
  FIXED = 'FIXED',
}

export enum BindType {
  MERCHANT = 'MERCHANT',
  CUSTOMER = 'CUSTOMER',
}

export enum PlatformRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  FINANCE = 'FINANCE',
  FULFILLMENT = 'FULFILLMENT',
  REVIEWER = 'REVIEWER',
}

export enum MerchantRole {
  MERCHANT_OWNER = 'MERCHANT_OWNER',
  MERCHANT_STAFF = 'MERCHANT_STAFF',
}

export enum OrderStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID = 'PAID',
  FULFILLED = 'FULFILLED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum LedgerStatus {
  ACCRUED = 'ACCRUED',
  SETTLED = 'SETTLED',
  VOID = 'VOID',
}

export enum SettlementBatchStatus {
  DRAFT = 'DRAFT',
  EXPORTED = 'EXPORTED',
  PAID = 'PAID',
}

export enum PurchaseOrderStatus {
  DRAFT = 'DRAFT',
  ORDERED = 'ORDERED',
  PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED',
  RECEIVED = 'RECEIVED',
  CANCELLED = 'CANCELLED',
}

export enum StockAdjustmentReason {
  DAMAGE = 'DAMAGE',
  COUNT_CORRECTION = 'COUNT_CORRECTION',
  RETURN = 'RETURN',
  OTHER = 'OTHER',
  TRANSFER_OUT = 'TRANSFER_OUT',
  TRANSFER_IN = 'TRANSFER_IN',
}

export enum StockTransferStatus {
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}
