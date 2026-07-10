"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CART_SESSION_HEADER = exports.cartSessionStorageKey = void 0;
const cartSessionStorageKey = (storeSlug) => `meridian:cart-session:${storeSlug}`;
exports.cartSessionStorageKey = cartSessionStorageKey;
exports.CART_SESSION_HEADER = 'X-Cart-Session';
//# sourceMappingURL=ecommerce.js.map