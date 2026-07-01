import type { OrderStatus } from './enums.js';
import type { FulfillmentType } from './phase-5-distribution.js';
import type { DeliveryAddress } from './phase-5-fulfillment.js';

/**
 * 电商订单相关类型定义
 * 涵盖商户订单管理和商店前端订单的通用结构
 */

/**
 * 生成购物车会话存储键名
 * 购物车会话数据存储在 localStorage，键名按商店 slug 隔离
 * @param storeSlug - 商店 URL slug 标识
 * @returns localStorage 键名字符串
 */
export const cartSessionStorageKey = (storeSlug: string): string =>
  `meridian:cart-session:${storeSlug}`;

/**
 * 购物车会话 Header 名称
 * 客户端在请求时通过此 Header 传递会话ID
 */
export const CART_SESSION_HEADER = 'X-Cart-Session';

/**
 * 商户订单商品行
 * 订单中单个商品的明细信息
 * @property id - 订单行唯一标识
 * @property productName - 商品名称
 * @property variantName - 变体名称（如颜色/尺寸）
 * @property quantity - 购买数量
 * @property unitPrice - 单价
 * @property lineTotal - 该行小计金额
 */
export interface MerchantOrderLine {
  id: string;
  productName: string;
  variantName: string;
  quantity: number;
  unitPrice: string | number;
  lineTotal: string | number;
}

/**
 * 商户订单客户信息
 * 下单的客户（消费者）基本信息
 * @property id - 客户ID（已登录用户）
 * @property email - 客户邮箱
 * @property firstName - 名
 * @property lastName - 姓
 */
export interface MerchantOrderCustomer {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

/**
 * 商户订单列表行
 * 用于 GET /merchant/orders 列表接口
 * @property id - 订单ID
 * @property tenantId - 所属租户ID
 * @property status - 订单状态
 * @property fulfillmentType - 履约类型（自提/配送）
 * @property pickupVerifiedAt - 自提核销时间（已核销时存在）
 * @property currency - 货币币种（如 CNY）
 * @property subtotal - 商品小计金额
 * @property tax - 税额
 * @property total - 订单总金额
 * @property guestEmail - 访客邮箱（未登录用户）
 * @property pickupCode - 自提码（用于门店核销）
 * @property createdAt - 下单时间
 * @property updatedAt - 最后更新时间
 * @property customer - 客户信息（已登录用户）
 * @property lines - 订单商品明细列表
 */
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

/**
 * 商户订单详情
 * 用于 GET /merchant/orders/:id 详情接口
 * 在列表项基础上增加关联的经销商和佣金信息
 * @property distributor - 归因经销商信息（带来此订单的经销商）
 * @property commissionEntry - 对应的佣金记录条目
 * @property lines - 订单商品明细（含完整的变体SKU信息）
 */
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

/**
 * 结账请求
 * 消费者完成选购后发起结账
 * @property guestEmail - 访客邮箱（未登录用户必填）
 * @property fulfillmentType - 履约类型（自提或配送）
 * @property deliveryAddress - 配送地址（fulfillmentType为DELIVERY时必填）
 */
export interface CheckoutRequest {
  guestEmail?: string;
  fulfillmentType?: FulfillmentType;
  deliveryAddress?: DeliveryAddress;
}

/**
 * 结账响应
 * 返回创建的交易订单和支付所需信息
 * @property order - 生成的订单信息
 * @property paymentIntent - Stripe 支付意图（包含 clientSecret 供前端确认支付）
 * @property mockPayment - 是否为模拟支付模式
 */
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

/**
 * 商店订单列表行
 * 消费者在商店前端查看自己的订单
 * @property id - 订单ID
 * @property status - 订单状态
 * @property fulfillmentType - 履约类型
 * @property currency - 货币币种
 * @property total - 订单总金额
 * @property createdAt - 下单时间
 * @property lineCount - 商品种类数量
 */
export interface StoreOrderListItem {
  id: string;
  status: OrderStatus;
  fulfillmentType?: FulfillmentType;
  currency: string;
  total: string | number;
  createdAt: string;
  lineCount: number;
}

/**
 * 商店订单详情
 * 消费者在商店前端查看订单详情
 * @property subtotal - 商品小计金额
 * @property tax - 税额
 * @property pickupCode - 自提码
 * @property pickupVerifiedAt - 自提核销时间
 * @property deliveryAddress - 配送地址
 * @property shippedAt - 发货时间
 * @property lines - 订单商品明细
 */
export interface StoreOrderDetail extends StoreOrderListItem {
  subtotal: string | number;
  tax: string | number;
  pickupCode?: string | null;
  pickupVerifiedAt?: string | null;
  deliveryAddress?: DeliveryAddress | null;
  shippedAt?: string | null;
  lines: MerchantOrderLine[];
}
