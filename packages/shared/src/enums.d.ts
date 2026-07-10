export declare enum OnboardingStatus {
    DRAFT = "DRAFT",
    SUBMITTED = "SUBMITTED",
    UNDER_REVIEW = "UNDER_REVIEW",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED"
}
export declare enum LeadStage {
    NEW = "NEW",
    QUALIFIED = "QUALIFIED",
    WON = "WON",
    LOST = "LOST"
}
export declare enum ActivityType {
    CALL = "CALL",
    NOTE = "NOTE",
    MEETING = "MEETING"
}
export declare enum CommissionType {
    PERCENT = "PERCENT",
    FIXED = "FIXED"
}
export declare enum PlatformRole {
    SUPER_ADMIN = "SUPER_ADMIN",
    FINANCE = "FINANCE",
    FULFILLMENT = "FULFILLMENT",
    REVIEWER = "REVIEWER"
}
export declare enum MerchantRole {
    MERCHANT_OWNER = "MERCHANT_OWNER",
    MERCHANT_STAFF = "MERCHANT_STAFF"
}
export declare enum OrderStatus {
    PENDING_PAYMENT = "PENDING_PAYMENT",
    PAID = "PAID",
    FULFILLED = "FULFILLED",
    CANCELLED = "CANCELLED",
    REFUNDED = "REFUNDED"
}
export declare enum LedgerStatus {
    ACCRUED = "ACCRUED",
    SETTLED = "SETTLED",
    VOID = "VOID"
}
export declare enum SettlementBatchStatus {
    DRAFT = "DRAFT",
    EXPORTED = "EXPORTED",
    PAID = "PAID"
}
export declare enum PurchaseOrderStatus {
    DRAFT = "DRAFT",
    ORDERED = "ORDERED",
    PARTIALLY_RECEIVED = "PARTIALLY_RECEIVED",
    RECEIVED = "RECEIVED",
    CANCELLED = "CANCELLED"
}
export declare enum StockAdjustmentReason {
    DAMAGE = "DAMAGE",
    COUNT_CORRECTION = "COUNT_CORRECTION",
    RETURN = "RETURN",
    OTHER = "OTHER",
    TRANSFER_OUT = "TRANSFER_OUT",
    TRANSFER_IN = "TRANSFER_IN"
}
export declare enum StockTransferStatus {
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED"
}
