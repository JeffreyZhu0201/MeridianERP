/**
 * FulfillmentTypeBadge - 履约类型徽章组件
 *
 * 用于标识订单的履约方式：
 * - PICKUP（自提）：消费者到店自取
 * - DELIVERY（配送）：送货上门
 *
 * @example
 * ```tsx
 * <FulfillmentTypeBadge type="PICKUP" />
 * <FulfillmentTypeBadge type="DELIVERY" />
 * ```
 */

import { Store, Truck } from 'lucide-react';

import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';

/** 履约类型枚举 */
export type FulfillmentType = 'PICKUP' | 'DELIVERY';

/** 履约类型配置 */
const config: Record<
  FulfillmentType,
  { label: string; variant: 'default' | 'secondary' | 'outline'; icon: typeof Store }
> = {
  PICKUP: { label: 'Pickup', variant: 'secondary', icon: Store },
  DELIVERY: { label: 'Delivery', variant: 'outline', icon: Truck },
};

/**
 * FulfillmentTypeBadge 属性接口
 * @param type - 履约类型（PICKUP/DELIVERY）
 * @param className - 自定义样式类名
 */
export interface FulfillmentTypeBadgeProps {
  type: FulfillmentType;
  className?: string;
}

/**
 * 履约类型徽章
 * - PICKUP: 灰色背景 + 商店图标
 * - DELIVERY: 边框样式 + 卡车图标
 */
export function FulfillmentTypeBadge({ type, className }: FulfillmentTypeBadgeProps) {
  const { label, variant, icon: Icon } = config[type];

  return (
    <Badge variant={variant} className={cn('gap-1', className)}>
      <Icon className="size-3" aria-hidden />
      {label}
    </Badge>
  );
}
