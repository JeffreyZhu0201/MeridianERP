import type { OrderStatus } from './enums.js';
import type { FulfillmentType } from './phase-5-distribution.js';
import type { DeliveryAddress } from './phase-5-fulfillment.js';
export declare const cartSessionStorageKey: (storeSlug: string) => string;
export declare const CART_SESSION_HEADER = "X-Cart-Session";
export interface MerchantOrderLine {
    id: string;
    productName: string;
    variantName: string;
    quantity: number;
    unitPrice: string | number;
    lineTotal: string | number;
}
export interface MerchantOrderCustomer {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
}
export interface MerchantOrderListItem {
    id: string;
    tenantId: string;
    status: OrderStatus;
    fulfillmentType: FulfillmentType;
    pickupVerifiedAt?: string | null;
    shippedAt?: string | null;
    currency: string;
    subtotal: string | number;
    tax: string | number;
    total: string | number;
    guestEmail: string | null;
    pickupCode?: string | null;
    deliveryAddress?: DeliveryAddress | null;
    createdAt: string;
    updatedAt: string;
    customer: MerchantOrderCustomer | null;
    lines: MerchantOrderLine[];
}
export interface MerchantOrderDetail extends MerchantOrderListItem {
    lines: Array<MerchantOrderLine & {
        variant?: {
            id: string;
            sku: string;
            name: string;
            price: string | number;
        } | null;
    }>;
}
export interface CheckoutRequest {
    guestEmail?: string;
    fulfillmentType?: FulfillmentType;
    deliveryAddress?: DeliveryAddress;
}
export interface CheckoutResponse {
    order: {
        id: string;
        status: OrderStatus;
        subtotal: number;
        tax: number;
        total: number;
        lines: MerchantOrderLine[];
    };
    paymentIntent: {
        id: string;
        clientSecret: string;
    };
    mockPayment: boolean;
}
export interface StoreOrderListItem {
    id: string;
    status: OrderStatus;
    fulfillmentType?: FulfillmentType;
    currency: string;
    total: string | number;
    createdAt: string;
    lineCount: number;
}
export interface StoreOrderDetail extends StoreOrderListItem {
    subtotal: string | number;
    tax: string | number;
    pickupCode?: string | null;
    pickupVerifiedAt?: string | null;
    deliveryAddress?: DeliveryAddress | null;
    shippedAt?: string | null;
    deliveredAt?: string | null;
    lines: MerchantOrderLine[];
}
export interface CrossStoreOrderListItem extends StoreOrderListItem {
    storeSlug: string;
    storeName: string;
}
export interface StoreCustomerProfile {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
}
