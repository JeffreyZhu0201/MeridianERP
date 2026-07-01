/**
 * 订单相关组件导出
 *
 * 提供订单管理所需的完整组件套件：
 * - 订单列表（支持自提/配送筛选）
 * - 履约类型徽章
 * - 自提核销对话框
 * - 配送发货确认对话框
 *
 * @example
 * ```tsx
 * import { OrderListFrame, FulfillmentTypeBadge, PickupVerifyDialog } from '@meridian/ui';
 * ```
 */

/** 履约类型徽章 - PICKUP（自提）/ DELIVERY（配送） */
export {
  FulfillmentTypeBadge,
  type FulfillmentType,
  type FulfillmentTypeBadgeProps,
} from './fulfillment-type-badge';

/** 订单列表框架 - 支持标签页筛选、状态筛选、搜索 */
export {
  OrderListFrame,
  type OrderListFrameProps,
} from './order-list-frame';

/** 订单列表行类型和标签页类型（从 @meridian/shared 重新导出） */
export type { OrderListRow, OrderListTab } from '@meridian/shared';

/** 自提核销对话框 - 6位验证码/二维码扫描 */
export {
  PickupVerifyDialog,
  type PickupVerifyDialogProps,
} from './pickup-verify-dialog';

/**
 * 配送发货确认对话框
 * @param DeliveryShipDialogProps - 配送发货配置
 * @param DeliveryShipLine - 配送商品明细
 */
export {
  DeliveryShipDialog,
  type DeliveryShipDialogProps,
  type DeliveryShipLine,
} from './delivery-ship-dialog';
