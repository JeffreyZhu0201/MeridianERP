"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_QUEUE_BACKOFF_MS = exports.DEFAULT_QUEUE_ATTEMPTS = exports.OrderJobName = exports.EmailJobName = exports.ORDER_QUEUE = exports.EMAIL_QUEUE = void 0;
exports.EMAIL_QUEUE = 'email';
exports.ORDER_QUEUE = 'orders';
exports.EmailJobName = {
    MERCHANT_WELCOME: 'merchant.welcome',
    MERCHANT_REJECTED: 'merchant.rejected',
    COMMISSION_ACCRUED: 'commission.accrued',
    ORDER_CONFIRMATION: 'order.confirmation',
};
exports.OrderJobName = {
    EXPIRE_PENDING: 'orders.expire-pending',
    EXPIRE_ISSUED_ALLOCATIONS: 'orders.expire-issued-allocations',
    SETTLEMENT_REMINDER: 'orders.settlement-reminder',
};
exports.DEFAULT_QUEUE_ATTEMPTS = 3;
exports.DEFAULT_QUEUE_BACKOFF_MS = 1000;
//# sourceMappingURL=queues.js.map