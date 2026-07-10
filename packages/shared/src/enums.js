"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockTransferStatus = exports.StockAdjustmentReason = exports.PurchaseOrderStatus = exports.SettlementBatchStatus = exports.LedgerStatus = exports.OrderStatus = exports.MerchantRole = exports.PlatformRole = exports.CommissionType = exports.ActivityType = exports.LeadStage = exports.OnboardingStatus = void 0;
var OnboardingStatus;
(function (OnboardingStatus) {
    OnboardingStatus["DRAFT"] = "DRAFT";
    OnboardingStatus["SUBMITTED"] = "SUBMITTED";
    OnboardingStatus["UNDER_REVIEW"] = "UNDER_REVIEW";
    OnboardingStatus["APPROVED"] = "APPROVED";
    OnboardingStatus["REJECTED"] = "REJECTED";
})(OnboardingStatus || (exports.OnboardingStatus = OnboardingStatus = {}));
var LeadStage;
(function (LeadStage) {
    LeadStage["NEW"] = "NEW";
    LeadStage["QUALIFIED"] = "QUALIFIED";
    LeadStage["WON"] = "WON";
    LeadStage["LOST"] = "LOST";
})(LeadStage || (exports.LeadStage = LeadStage = {}));
var ActivityType;
(function (ActivityType) {
    ActivityType["CALL"] = "CALL";
    ActivityType["NOTE"] = "NOTE";
    ActivityType["MEETING"] = "MEETING";
})(ActivityType || (exports.ActivityType = ActivityType = {}));
var CommissionType;
(function (CommissionType) {
    CommissionType["PERCENT"] = "PERCENT";
    CommissionType["FIXED"] = "FIXED";
})(CommissionType || (exports.CommissionType = CommissionType = {}));
var PlatformRole;
(function (PlatformRole) {
    PlatformRole["SUPER_ADMIN"] = "SUPER_ADMIN";
    PlatformRole["FINANCE"] = "FINANCE";
    PlatformRole["FULFILLMENT"] = "FULFILLMENT";
    PlatformRole["REVIEWER"] = "REVIEWER";
})(PlatformRole || (exports.PlatformRole = PlatformRole = {}));
var MerchantRole;
(function (MerchantRole) {
    MerchantRole["MERCHANT_OWNER"] = "MERCHANT_OWNER";
    MerchantRole["MERCHANT_STAFF"] = "MERCHANT_STAFF";
})(MerchantRole || (exports.MerchantRole = MerchantRole = {}));
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING_PAYMENT"] = "PENDING_PAYMENT";
    OrderStatus["PAID"] = "PAID";
    OrderStatus["FULFILLED"] = "FULFILLED";
    OrderStatus["CANCELLED"] = "CANCELLED";
    OrderStatus["REFUNDED"] = "REFUNDED";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var LedgerStatus;
(function (LedgerStatus) {
    LedgerStatus["ACCRUED"] = "ACCRUED";
    LedgerStatus["SETTLED"] = "SETTLED";
    LedgerStatus["VOID"] = "VOID";
})(LedgerStatus || (exports.LedgerStatus = LedgerStatus = {}));
var SettlementBatchStatus;
(function (SettlementBatchStatus) {
    SettlementBatchStatus["DRAFT"] = "DRAFT";
    SettlementBatchStatus["EXPORTED"] = "EXPORTED";
    SettlementBatchStatus["PAID"] = "PAID";
})(SettlementBatchStatus || (exports.SettlementBatchStatus = SettlementBatchStatus = {}));
var PurchaseOrderStatus;
(function (PurchaseOrderStatus) {
    PurchaseOrderStatus["DRAFT"] = "DRAFT";
    PurchaseOrderStatus["ORDERED"] = "ORDERED";
    PurchaseOrderStatus["PARTIALLY_RECEIVED"] = "PARTIALLY_RECEIVED";
    PurchaseOrderStatus["RECEIVED"] = "RECEIVED";
    PurchaseOrderStatus["CANCELLED"] = "CANCELLED";
})(PurchaseOrderStatus || (exports.PurchaseOrderStatus = PurchaseOrderStatus = {}));
var StockAdjustmentReason;
(function (StockAdjustmentReason) {
    StockAdjustmentReason["DAMAGE"] = "DAMAGE";
    StockAdjustmentReason["COUNT_CORRECTION"] = "COUNT_CORRECTION";
    StockAdjustmentReason["RETURN"] = "RETURN";
    StockAdjustmentReason["OTHER"] = "OTHER";
    StockAdjustmentReason["TRANSFER_OUT"] = "TRANSFER_OUT";
    StockAdjustmentReason["TRANSFER_IN"] = "TRANSFER_IN";
})(StockAdjustmentReason || (exports.StockAdjustmentReason = StockAdjustmentReason = {}));
var StockTransferStatus;
(function (StockTransferStatus) {
    StockTransferStatus["COMPLETED"] = "COMPLETED";
    StockTransferStatus["CANCELLED"] = "CANCELLED";
})(StockTransferStatus || (exports.StockTransferStatus = StockTransferStatus = {}));
//# sourceMappingURL=enums.js.map