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

export interface VerifyPickupRequest {
  code: string;
}
