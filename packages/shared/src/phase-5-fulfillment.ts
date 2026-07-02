import type { FulfillmentType } from './phase-5-distribution.js';
import type { OrderStatus } from './enums.js';

/**
 * 配送地址
 * 消费者选择配送时填写的收货地址
 * @property name - 收货人姓名
 * @property phone - 收货人电话
 * @property line1 - 地址第一行（街道/门牌号）
 * @property line2 - 地址第二行（可选，单元/楼层等）
 * @property city - 城市
 * @property province - 省份/州（可选）
 * @property postalCode - 邮政编码
 */
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
