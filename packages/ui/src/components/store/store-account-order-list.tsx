import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';

export interface StoreAccountOrderRow {
  id: string;
  dateLabel: string;
  statusLabel: string;
  totalLabel: string;
  viewAction: ReactNode;
}

export interface StoreAccountOrderListProps {
  title: string;
  orders: StoreAccountOrderRow[];
  empty?: ReactNode;
  className?: string;
}

/**
 * Card-wrapped order history list — stich.md account workspace.
 */
export function StoreAccountOrderList({
  title,
  orders,
  empty,
  className,
}: StoreAccountOrderListProps) {
  if (orders.length === 0 && empty) {
    return <div className={className}>{empty}</div>;
  }

  return (
    <div className={cn('store-bento-card overflow-hidden', className)}>
      <div className="border-b border-border bg-muted/30 px-4 py-3 md:px-6">
        <h2 className="store-headline-lg text-foreground">{title}</h2>
      </div>
      <ul className="divide-y divide-border">
        {orders.map((order) => (
          <li
            key={order.id}
            className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6"
          >
            <div className="min-w-0 space-y-1">
              <p className="store-label font-mono text-xs text-muted-foreground">
                {order.id.slice(0, 8)}…
              </p>
              <p className="store-body-sm text-muted-foreground">{order.dateLabel}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:justify-end">
              <Badge variant="secondary">{order.statusLabel}</Badge>
              <span className="store-headline-lg tabular-nums">{order.totalLabel}</span>
              {order.viewAction}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
