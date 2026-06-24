import { Badge, type BadgeVariant } from '../ui/badge';
import { cn } from '../../lib/utils';

/** 采购单状态徽章文案（商户端中文） */
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
