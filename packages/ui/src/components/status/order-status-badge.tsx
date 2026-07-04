import { OrderStatus } from '@meridian/shared';

import { Badge, type BadgeVariant } from '../ui/badge';

const statusVariant: Record<string, BadgeVariant> = {
  [OrderStatus.PENDING_PAYMENT]: 'warning',
  [OrderStatus.PAID]: 'default',
  [OrderStatus.FULFILLED]: 'success',
  [OrderStatus.CANCELLED]: 'secondary',
  [OrderStatus.REFUNDED]: 'destructive',
};

export interface OrderStatusBadgeProps {
  status: string;
  /** Pre-translated label from portal i18n */
  label: string;
  className?: string;
}

export function OrderStatusBadge({ status, label, className }: OrderStatusBadgeProps) {
  return (
    <Badge variant={statusVariant[status] ?? 'secondary'} className={className}>
      {label}
    </Badge>
  );
}
