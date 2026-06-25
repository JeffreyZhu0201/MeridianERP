import { Store, Truck } from 'lucide-react';

import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';

export type FulfillmentType = 'PICKUP' | 'DELIVERY';

const config: Record<
  FulfillmentType,
  { label: string; variant: 'default' | 'secondary' | 'outline'; icon: typeof Store }
> = {
  PICKUP: { label: 'Pickup', variant: 'secondary', icon: Store },
  DELIVERY: { label: 'Delivery', variant: 'outline', icon: Truck },
};

export interface FulfillmentTypeBadgeProps {
  type: FulfillmentType;
  className?: string;
}

export function FulfillmentTypeBadge({ type, className }: FulfillmentTypeBadgeProps) {
  const { label, variant, icon: Icon } = config[type];

  return (
    <Badge variant={variant} className={cn('gap-1', className)}>
      <Icon className="size-3" aria-hidden />
      {label}
    </Badge>
  );
}
