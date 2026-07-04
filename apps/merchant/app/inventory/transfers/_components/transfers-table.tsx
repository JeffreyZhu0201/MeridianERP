'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Button,
  EmptyState,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@meridian/ui';
import type { StockTransferWithDetails, Warehouse } from '@meridian/shared';

interface TransfersTableProps {
  transfers: StockTransferWithDetails[];
  total: number;
  page: number;
  warehouses: Warehouse[];
}

export function TransfersTable({
  transfers = [],
  total,
  page,
  warehouses,
}: TransfersTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromWarehouseId = searchParams.get('fromWarehouseId') ?? '';
  const toWarehouseId = searchParams.get('toWarehouseId') ?? '';

  const t = useTranslations('merchant.inventory.transfers');
  const tCommon = useTranslations('common');
  const tInvCommon = useTranslations('merchant.inventory.common');

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.set('page', '1');
    router.push(`/inventory/transfers?${params.toString()}`);
  }

  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap gap-3">
          <div className="space-y-2">
            <label htmlFor="transfer-from" className="text-sm font-medium">
              {t('fromWarehouse')}
            </label>
            <Select
              id="transfer-from"
              value={fromWarehouseId}
              onChange={(e) => updateFilter('fromWarehouseId', e.target.value)}
              className="min-h-11"
            >
              <option value="">{tInvCommon('allWarehouses')}</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <label htmlFor="transfer-to" className="text-sm font-medium">
              {t('toWarehouse')}
            </label>
            <Select
              id="transfer-to"
              value={toWarehouseId}
              onChange={(e) => updateFilter('toWarehouseId', e.target.value)}
              className="min-h-11"
            >
              <option value="">{tInvCommon('allWarehouses')}</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <Button asChild size="sm" className="rounded-full">
          <Link href="/inventory/transfers/new">{t('new')}</Link>
        </Button>
      </div>

      {transfers.length === 0 ? (
        <EmptyState
          title={t('emptyTitle')}
          description={t('emptyDescription')}
          action={
            <Button asChild size="sm" className="rounded-full">
              <Link href="/inventory/transfers/new">{t('new')}</Link>
            </Button>
          }
        />
      ) : (
        <div className="rounded-lg ring-1 ring-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('created')}</TableHead>
                <TableHead>{t('fromWarehouse')}</TableHead>
                <TableHead>{t('toWarehouse')}</TableHead>
                <TableHead>{t('lineCount')}</TableHead>
                <TableHead>{t('createdBy')}</TableHead>
                <TableHead>{t('note')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfers.map((transfer) => (
                <TableRow key={transfer.id}>
                  <TableCell>
                    <Link
                      href={`/inventory/transfers/${transfer.id}`}
                      className="hover:underline"
                    >
                      {new Date(transfer.createdAt).toLocaleString()}
                    </Link>
                  </TableCell>
                  <TableCell>{transfer.fromWarehouse.name}</TableCell>
                  <TableCell>{transfer.toWarehouse.name}</TableCell>
                  <TableCell>{transfer.lines.length}</TableCell>
                  <TableCell className="text-muted-foreground">{transfer.createdBy.email}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">
                    {transfer.note ?? '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-muted-foreground">{tCommon('pageOf', { page, total })}</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set('page', String(page - 1));
                router.push(`/inventory/transfers?${params.toString()}`);
              }}
            >
              {tCommon('previous')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set('page', String(page + 1));
                router.push(`/inventory/transfers?${params.toString()}`);
              }}
            >
              {tCommon('next')}
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
