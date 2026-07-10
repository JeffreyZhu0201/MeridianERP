import type { FulfillmentType } from './phase-5-distribution.js';
import type { OrderStatus } from './enums.js';
export interface DeliveryAddress {
    name: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    province?: string;
    postalCode?: string;
}
export interface CheckoutFulfillmentRequest {
    fulfillmentType: FulfillmentType;
    deliveryAddress?: DeliveryAddress;
    guestEmail?: string;
}
export interface OrderFulfillmentSummary {
    id: string;
    status: OrderStatus;
    fulfillmentType: FulfillmentType;
    total: string | number;
    pickupCode: string | null;
    pickupVerifiedAt: string | null;
    deliveryAddress: DeliveryAddress | null;
    shippedAt: string | null;
    tenantId: string;
    tenantName?: string;
    createdAt: string;
}
export interface PickupTokenResponse {
    orderId: string;
    pickupCode: string;
    qrPayload: string;
}
export interface PlatformOrderListItem {
    id: string;
    tenantId: string;
    status: OrderStatus;
    fulfillmentType: FulfillmentType;
    currency: string;
    total: string | number;
    guestEmail: string | null;
    createdAt: string;
    tenant: {
        id: string;
        slug: string;
        businessName?: string | null;
    };
}
export interface PlatformOrderDetail {
    id: string;
    tenantId: string;
    status: OrderStatus;
    fulfillmentType: FulfillmentType;
    currency: string;
    total: string | number;
    guestEmail: string | null;
    deliveryAddress: DeliveryAddress | null;
    pickupCode: string | null;
    pickupVerifiedAt: string | null;
    shippedAt: string | null;
    createdAt: string;
    tenant: {
        id: string;
        slug: string;
        businessName?: string | null;
    };
    customer?: {
        id: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
        accountId: string;
    } | null;
    lines: Array<{
        id: string;
        productName: string;
        variantName: string;
        quantity: number;
        unitPrice: string | number;
        unitWholesalePrice?: string | number | null;
        lineTotal: string | number;
        skuCode?: string | null;
    }>;
}
export interface VerifyPickupRequest {
    code: string;
}
