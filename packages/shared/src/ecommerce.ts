import type { OrderStatus } from './enums.js';
import type { FulfillmentType } from './phase-5-distribution.js';
import type { DeliveryAddress } from './phase-5-fulfillment.js';

/**
 * 生成购物车会话存储键名
 * 购物车会话数据存储在 localStorage，键名按商店 slug 隔离
 * @param storeSlug - 商店 URL slug 标识
 * @returns localStorage 键名字符串
 */
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
  pickupCode?: string | null;
  createdAt: string;
  updatedAt: string;
  customer: MerchantOrderCustomer | null;
  lines: MerchantOrderLine[];
}

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
  lines: MerchantOrderLine[];
}
