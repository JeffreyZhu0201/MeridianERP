import type { OrderStatus } from './enums.js';
import type { FulfillmentType } from './phase-5-distribution.js';
import type { DeliveryAddress } from './phase-5-fulfillment.js';

/** localStorage key for guest cart session — scoped per store slug. */
export const cartSessionStorageKey = (storeSlug: string): string =>
  `meridian:cart-session:${storeSlug}`;

export const CART_SESSION_HEADER = 'X-Cart-Session';

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

/** List item — GET /merchant/orders */
export interface MerchantOrderListItem {
  id: string;
  tenantId: string;
  status: OrderStatus;
  fulfillmentType: FulfillmentType;
  pickupVerifiedAt?: string | null;
  currency: string;
  subtotal: string | number;
  tax: string | number;
  total: string | number;
  guestEmail: string | null;
  createdAt: string;
  updatedAt: string;
  customer: MerchantOrderCustomer | null;
  lines: MerchantOrderLine[];
}

/** Detail — GET /merchant/orders/:id */
export interface MerchantOrderDetail extends MerchantOrderListItem {
  distributor?: { id: string; name: string } | null;
  commissionEntry?: { id: string; amount: string | number; status: string } | null;
  lines: Array<
    MerchantOrderLine & {
      variant?: {
        id: string;
        sku: string;
        name: string;
        price: string | number;
      } | null;
    }
  >;
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

/** List item — GET /store/:slug/orders (customer-scoped) */
export interface StoreOrderListItem {
  id: string;
  status: OrderStatus;
  fulfillmentType?: FulfillmentType;
  currency: string;
  total: string | number;
  createdAt: string;
  lineCount: number;
}

/** Detail — GET /store/:slug/orders/:id */
export interface StoreOrderDetail extends StoreOrderListItem {
  subtotal: string | number;
  tax: string | number;
  pickupCode?: string | null;
  deliveryAddress?: DeliveryAddress | null;
  shippedAt?: string | null;
  lines: MerchantOrderLine[];
}
