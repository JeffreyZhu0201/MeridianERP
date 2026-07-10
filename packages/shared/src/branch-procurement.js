"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLATFORM_PROCUREMENT_TAB_STATUSES = exports.BRANCH_PURCHASE_ORDER_STATUSES = void 0;
exports.isBranchPurchaseOrderStatus = isBranchPurchaseOrderStatus;
exports.formatBranchPurchaseOrderStatus = formatBranchPurchaseOrderStatus;
exports.BRANCH_PURCHASE_ORDER_STATUSES = [
    'PENDING_PAYMENT',
    'PAID',
    'PROCESSING',
    'SHIPPED',
    'RECEIVED',
    'CANCELLED',
];
exports.PLATFORM_PROCUREMENT_TAB_STATUSES = [
    'PROCESSING',
    'SHIPPED',
    'RECEIVED',
    'ALL',
];
function isBranchPurchaseOrderStatus(value) {
    return exports.BRANCH_PURCHASE_ORDER_STATUSES.includes(value);
}
function formatBranchPurchaseOrderStatus(status, labels) {
    return isBranchPurchaseOrderStatus(status) ? labels[status] : status;
}
//# sourceMappingURL=branch-procurement.js.map