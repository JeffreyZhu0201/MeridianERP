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

/** Detail — GET /platform/orders/:id */
export interface PlatformOrderDetail {
  id: string;
  status: OrderStatus;
  fulfillmentType: FulfillmentType;
  currency: string;
  total: string | number;
  guestEmail: string | null;
  deliveryAddress: DeliveryAddress | null;
  createdAt: string;
  tenant: {
    id: string;
    slug: string;
    businessName?: string | null;
  };
  lines: Array<{
    id: string;
    productName: string;
    variantName: string;
    quantity: number;
    skuCode?: string | null;
  }>;
}

export interface VerifyPickupRequest {
  code: string;
}
