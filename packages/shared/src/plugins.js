"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MERCHANT_PLUGIN_STUB_CODES = exports.MERCHANT_PLUGIN_ROUTE_BY_CODE = exports.PLUGIN_NOT_INSTALLED = exports.MERCHANT_PLUGIN_CODES = void 0;
exports.MERCHANT_PLUGIN_CODES = [
    'crm',
    'hrm',
    'im',
    'finance_tax',
    'oa',
    'e_signature',
    'customer_service',
];
exports.PLUGIN_NOT_INSTALLED = 'PLUGIN_NOT_INSTALLED';
exports.MERCHANT_PLUGIN_ROUTE_BY_CODE = {
    crm: '/crm/contacts',
    hrm: '/hrm',
    im: '/im',
    finance_tax: '/finance-tax',
    oa: '/oa',
    e_signature: '/e-signature',
    customer_service: '/customer-service',
};
exports.MERCHANT_PLUGIN_STUB_CODES = exports.MERCHANT_PLUGIN_CODES.filter((code) => code !== 'crm');
//# sourceMappingURL=plugins.js.map