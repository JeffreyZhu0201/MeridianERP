import type { FulfillmentType } from './phase-5-distribution.js';
import type { OrderStatus } from './enums.js';

/**
 * Phase 5 履约配送相关类型定义
 * 涵盖配送地址、订单履约、自提核销等功能
 */

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

/**
 * 结账履约方式请求
 * 消费者结账时选择配送或自提
 * @property fulfillmentType - 履约类型（必填）
 * @property deliveryAddress - 配送地址（fulfillmentType 为 DELIVERY 时必填）
 * @property guestEmail - 访客邮箱（可选，未登录用户必填）
 */
export interface CheckoutFulfillmentRequest {
  fulfillmentType: FulfillmentType;
  deliveryAddress?: DeliveryAddress;
  guestEmail?: string;
}

/**
 * 订单履约摘要
 * 用于订单列表展示的核心履约信息
 * @property id - 订单ID
 * @property status - 订单状态
 * @property fulfillmentType - 履约类型
 * @property total - 订单总金额
 * @property pickupCode - 自提码（用于门店核销）
 * @property pickupVerifiedAt - 自提核销时间
 * @property deliveryAddress - 配送地址
 * @property shippedAt - 发货时间
 * @property tenantId - 商户租户ID
 * @property tenantName - 商户名称
 * @property createdAt - 下单时间
 */
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

/**
 * 自提核销令牌响应
 * 门店验证消费者自提时返回的信息
 * @property orderId - 订单ID
 * @property pickupCode - 自提码
 * @property qrPayload - 二维码 Payload（可用于扫码验证）
 */
export interface PickupTokenResponse {
  orderId: string;
  pickupCode: string;
  qrPayload: string;
}

/**
 * 平台订单详情
 * GET /platform/orders/:id 平台管理员查看订单完整信息
 * @property id - 订单ID
 * @property status - 订单状态
 * @property fulfillmentType - 履约类型
 * @property currency - 货币币种
 * @property total - 订单总金额
 * @property guestEmail - 访客邮箱
 * @property deliveryAddress - 配送地址
 * @property createdAt - 下单时间
 * @property tenant - 商户信息
 * @property lines - 订单商品明细
 */
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

/**
 * 核销自提请求
 * 门店验证消费者到店取货时提交
 * @property code - 消费者提供的自提码
 */
export interface VerifyPickupRequest {
  code: string;
}
