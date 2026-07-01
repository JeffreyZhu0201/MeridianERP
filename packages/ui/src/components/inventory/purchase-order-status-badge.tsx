/**
 * PurchaseOrderStatusBadge - 采购单状态徽章组件
 *
 * 用于展示采购单的状态（商户端中文显示）：
 * - DRAFT（草稿）
 * - ORDERED（已下单）
 * - PARTIALLY_RECEIVED（部分收货）- 黄色警告样式
 * - RECEIVED（已收货）- 绿色成功样式
 * - CANCELLED（已取消）- 红色危险样式
 *
 * @example
 * ```tsx
 * <PurchaseOrderStatusBadge status="RECEIVED" />
 * <PurchaseOrderStatusBadge status="PARTIALLY_RECEIVED" />
 * ```
 */

import { Badge, type BadgeVariant } from '../ui/badge';
import { cn } from '../../lib/utils';

/**
 * 采购单状态配置
 * - label: 中文显示文案
 * - variant: shadcn/ui Badge 变体
 * - className: 自定义颜色类名
 */
const statusConfig: Record<string, { label: string; variant: BadgeVariant; className?: string }> = {
  DRAFT: { label: '草稿', variant: 'secondary' },
  ORDERED: { label: '已下单', variant: 'outline' },
  PARTIALLY_RECEIVED: {
    label: '部分收货',
    variant: 'warning',
    className: 'bg-amber-50 text-amber-600 border-amber-200',
  },
  RECEIVED: {
    label: '已收货',
    variant: 'success',
    className: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  },
  CANCELLED: { label: '已取消', variant: 'destructive' },
};

/**
 * 采购单状态徽章
 * @param status - 采购单状态码
 * @param className - 自定义样式类名
 */
export function PurchaseOrderStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const config = statusConfig[status] ?? {
    label: status,
    variant: 'secondary' as const,
  };

  return (
    <Badge variant={config.variant} className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
