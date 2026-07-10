"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatPickupCodeHint = formatPickupCodeHint;
function formatPickupCodeHint(pickupCode) {
    if (!pickupCode || pickupCode.length < 2)
        return undefined;
    return `••••${pickupCode.slice(-2)}`;
}
//# sourceMappingURL=order-list.js.map