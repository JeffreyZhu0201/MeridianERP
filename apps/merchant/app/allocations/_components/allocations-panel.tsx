'use client';

import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  Badge,
  Button,
  EmptyState,
  ListPageFrame,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@meridian/ui';

import { apiFetch } from '@/lib/api';

export interface MerchantAllocationOrder {
  id: string;
  status: string;
  note: string | null;
  issuedAt: string | null;
  lines: Array<{
    quantity: number;
    wholesalePrice: string | number;
    masterSku: { skuCode: string; name: string };
  }>;
}

interface AllocationsPanelProps {
  allocations: MerchantAllocationOrder[];
  token: string;
}

export function AllocationsPanel({ allocations, token }: AllocationsPanelProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('merchant.allocations');
  const [error, setError] = useState('');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const formatMoney = (value: string | number) =>
    new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2,
    }).format(Number(value));

  async function handleConfirm(id: string) {
    setConfirmingId(id);
    setError('');
    try {
      await apiFetch(`/merchant/allocations/${id}/confirm`, { method: 'POST' }, token);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('confirmFailed'));
    } finally {
      setConfirmingId(null);
    }
  }

  return (
    <ListPageFrame title={t('title')} description={t('description')}>
      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
      {allocations.length === 0 ? (
        <EmptyState title={t('empty')} description={t('emptyDescription')} />
      ) : (
        <div className="rounded-xl ring-1 ring-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('columns.id')}</TableHead>
                <TableHead>{t('columns.lines')}</TableHead>
                <TableHead>{t('columns.total')}</TableHead>
                <TableHead>{t('columns.status')}</TableHead>
                <TableHead className="text-right">{t('columns.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allocations.map((order) => {
                const total = order.lines.reduce(
                  (sum, l) => sum + Number(l.wholesalePrice) * l.quantity,
                  0,
                );
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}</TableCell>
                    <TableCell className="text-xs">
                      {order.lines.map((l) => (
                        <div key={`${order.id}-${l.masterSku.skuCode}`}>
                          {l.masterSku.name} × {l.quantity}
                        </div>
                      ))}
                    </TableCell>
                    <TableCell className="tabular-nums">{formatMoney(total)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{order.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {order.status === 'ISSUED' ? (
                        <Button
                          size="sm"
                          disabled={confirmingId === order.id}
                          onClick={() => handleConfirm(order.id)}
                        >
                          {confirmingId === order.id ? t('confirming') : t('confirm')}
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </ListPageFrame>
  );
}
