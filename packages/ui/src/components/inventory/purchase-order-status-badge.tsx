import { Badge, type BadgeVariant } from '../ui/badge';
import { cn } from '../../lib/utils';

const statusConfig: Record<string, { label: string; variant: BadgeVariant; className?: string }> = {
  DRAFT: { label: 'Draft', variant: 'secondary' },
  ORDERED: { label: 'Ordered', variant: 'outline' },
  PARTIALLY_RECEIVED: {
    label: 'Partial',
    variant: 'warning',
    className: 'bg-amber-50 text-amber-600 border-amber-200',
  },
  RECEIVED: {
    label: 'Received',
    variant: 'success',
    className: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  },
  CANCELLED: { label: 'Cancelled', variant: 'destructive' },
};

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
