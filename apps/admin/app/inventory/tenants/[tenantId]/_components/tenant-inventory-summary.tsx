'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Badge,
  BentoDetailHero,
  Card,
  CardContent,
  DetailPageFrame,
  EmptyState,
  Input,
  Label,
  PurchaseOrderStatusBadge,
  Select,
  StockAdjustmentReasonBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@meridian/ui';
import type {
  PlatformTenantInventorySummary,
  PurchaseOrder,
  StockAdjustmentWithDetails,
} from '@meridian/shared';

interface ListMeta {
  total: number;
  page: number;
  limit: number;
}

interface TenantInventorySummaryProps {
  tenantId: string;
  businessName: string;
  summary: PlatformTenantInventorySummary;
  adjustments: StockAdjustmentWithDetails[];
  adjustmentsMeta: ListMeta;
  purchaseOrders: PurchaseOrder[];
  purchaseOrdersMeta: ListMeta;
  adjFrom: string;
  adjTo: string;
  poStatus: string;
}

const PO_STATUSES = ['DRAFT', 'ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'] as const;

export function TenantInventorySummary({
  tenantId,
  businessName,
  summary,
  adjustments,
  purchaseOrders,
  adjFrom,
  adjTo,
  poStatus,
}: TenantInventorySummaryProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') ?? 'overview';
  const t = useTranslations('admin.inventory');
  const tc = useTranslations('common');

  const tabs = [
    { id: 'overview', label: t('tabs.overview') },
    { id: 'adjustments', label: t('tabs.adjustments') },
    { id: 'purchase-orders', label: t('tabs.purchaseOrders') },
  ] as const;

  function tabHref(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', id);
    params.delete('adjPage');
    params.delete('poPage');
    return `${pathname}?${params.toString()}`;
  }

  function applyAdjustmentFilters(next: { from?: string; to?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', 'adjustments');
    params.delete('adjPage');
    if (next.from) params.set('adjFrom', next.from);
    else params.delete('adjFrom');
    if (next.to) params.set('adjTo', next.to);
    else params.delete('adjTo');
    router.push(`${pathname}?${params.toString()}`);
  }

  function applyPoStatus(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', 'purchase-orders');
    params.delete('poPage');
    if (value) params.set('poStatus', value);
    else params.delete('poStatus');
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <DetailPageFrame
      title={t('title', { businessName })}
      description={t('description')}
      backHref="/inventory"
      backLabel={t('backLabel')}
    >
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
        {t('readOnlyBanner')}
      </div>

      <BentoDetailHero
        metrics={[
          { title: t('metrics.warehouses'), value: summary.warehouseCount },
          { title: t('metrics.skus'), value: summary.skuCount },
          { title: t('metrics.unitsOnHand'), value: summary.totalUnitsOnHand.toLocaleString() },
          { title: t('metrics.lowStock'), value: summary.lowStockCount },
        ]}
      />

      <div className="flex gap-2 border-b border-border/50">
        {tabs.map((item) => (
          <Link
            key={item.id}
            href={tabHref(item.id)}
            className={`border-b-2 px-4 py-2 text-sm font-medium ${
              tab === item.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {tab === 'overview' ? (
        <Card>
          <CardContent className="p-0 pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('columns.name')}</TableHead>
                  <TableHead>{t('columns.default')}</TableHead>
                  <TableHead className="text-right">{t('columns.skus')}</TableHead>
                  <TableHead className="text-right">{t('columns.units')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.warehouses.map((wh) => (
                  <TableRow key={wh.id}>
                    <TableCell className="font-medium">{wh.name}</TableCell>
                    <TableCell>
                      {wh.isDefault ? (
                        <Badge variant="outline">{t('defaultBadge')}</Badge>
                      ) : (
                        tc('emptyDash')
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm tabular-nums">
                      {wh.skuCount}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm tabular-nums">
                      {wh.unitsOnHand}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      {tab === 'adjustments' ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="adj-from">{t('filterFrom')}</Label>
              <Input
                id="adj-from"
                type="date"
                value={adjFrom}
                onChange={(e) => applyAdjustmentFilters({ from: e.target.value, to: adjTo })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adj-to">{t('filterTo')}</Label>
              <Input
                id="adj-to"
                type="date"
                value={adjTo}
                onChange={(e) => applyAdjustmentFilters({ from: adjFrom, to: e.target.value })}
              />
            </div>
          </div>
          <div className="rounded-xl ring-1 ring-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('columns.date')}</TableHead>
                  <TableHead>{t('columns.product')}</TableHead>
                  <TableHead className="text-right">{t('columns.delta')}</TableHead>
                  <TableHead>{t('columns.reason')}</TableHead>
                  <TableHead>{t('columns.actor')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adjustments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      {t('emptyAdjustments')}
                    </TableCell>
                  </TableRow>
                ) : (
                  adjustments.map((adj) => (
                    <TableRow key={adj.id}>
                      <TableCell className="text-muted-foreground">
                        {new Date(adj.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div>{adj.variant.productName}</div>
                        <div className="font-mono text-xs text-muted-foreground">{adj.variant.sku}</div>
                      </TableCell>
                      <TableCell
                        className={`text-right font-mono text-sm ${
                          adj.quantityDelta > 0 ? 'text-emerald-600' : 'text-destructive'
                        }`}
                      >
                        {adj.quantityDelta > 0 ? `+${adj.quantityDelta}` : adj.quantityDelta}
                      </TableCell>
                      <TableCell>
                        <StockAdjustmentReasonBadge reason={adj.reason} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{adj.actor.email}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : null}

      {tab === 'purchase-orders' ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="po-status">{t('filterPoStatus')}</Label>
            <Select
              id="po-status"
              value={poStatus}
              onChange={(e) => applyPoStatus(e.target.value)}
              className="w-[200px]"
            >
              <option value="">{t('allPoStatuses')}</option>
              {PO_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.replace(/_/g, ' ')}
                </option>
              ))}
            </Select>
          </div>
          <div className="rounded-xl ring-1 ring-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('columns.poNumber')}</TableHead>
                  <TableHead>{t('columns.supplier')}</TableHead>
                  <TableHead>{t('columns.status')}</TableHead>
                  <TableHead>{t('columns.created')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      {t('emptyPurchaseOrders')}
                    </TableCell>
                  </TableRow>
                ) : (
                  purchaseOrders.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell className="font-mono text-xs">{po.poNumber}</TableCell>
                      <TableCell>{po.supplierName}</TableCell>
                      <TableCell>
                        <PurchaseOrderStatusBadge status={po.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(po.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : null}
    </DetailPageFrame>
  );
}
