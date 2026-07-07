'use client';

import { useState } from 'react';
import type { CustomerDeliveryAddressRow } from '@meridian/shared';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { EmptyState } from '../empty-state';
import { cn } from '../../lib/utils';

export interface StoreAddressListProps {
  addresses: CustomerDeliveryAddressRow[];
  labels: {
    title: string;
    add: string;
    edit: string;
    remove: string;
    setDefault: string;
    defaultBadge: string;
    emptyTitle: string;
    emptyDescription: string;
  };
  onAdd: () => void;
  onEdit: (address: CustomerDeliveryAddressRow) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
  pendingId?: string | null;
  className?: string;
}

function formatAddressLine(address: CustomerDeliveryAddressRow): string {
  return [
    address.line1,
    address.line2,
    [address.city, address.province, address.postalCode].filter(Boolean).join(', '),
  ]
    .filter(Boolean)
    .join(' · ');
}

export function StoreAddressList({
  addresses,
  labels,
  onAdd,
  onEdit,
  onDelete,
  onSetDefault,
  pendingId,
  className,
}: StoreAddressListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (addresses.length === 0) {
    return (
      <div className={className}>
        <EmptyState
          title={labels.emptyTitle}
          description={labels.emptyDescription}
          action={
            <Button type="button" onClick={onAdd}>
              {labels.add}
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="store-headline-lg">{labels.title}</h2>
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>
          {labels.add}
        </Button>
      </div>
      <ul className="space-y-3">
        {addresses.map((address) => {
          const busy = pendingId === address.id;
          return (
            <li key={address.id} className="store-bento-card space-y-3 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">{address.name}</p>
                    {address.isDefault ? (
                      <Badge variant="secondary">{labels.defaultBadge}</Badge>
                    ) : null}
                    {address.label ? (
                      <span className="text-sm text-muted-foreground">{address.label}</span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{address.phone}</p>
                  <p className="mt-1 text-sm text-foreground">{formatAddressLine(address)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!address.isDefault ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onClick={() => onSetDefault(address.id)}
                    >
                      {labels.setDefault}
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => onEdit(address)}
                  >
                    {labels.edit}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={busy}
                    onClick={() => {
                      if (deletingId === address.id) {
                        onDelete(address.id);
                        setDeletingId(null);
                        return;
                      }
                      setDeletingId(address.id);
                    }}
                  >
                    {deletingId === address.id ? labels.remove : labels.remove}
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
