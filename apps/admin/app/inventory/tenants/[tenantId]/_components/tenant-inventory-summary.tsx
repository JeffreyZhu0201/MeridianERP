'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Badge,
  BentoDetailHero,
  Card,
  CardContent,
  DetailPageFrame,
  EmptyState,
  PurchaseOrderStatusBadge,
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

interface TenantInventorySummaryProps {
  tenantId: string;
  businessName: string;
  summary: PlatformTenantInventorySummary;
  adjustments: StockAdjustmentWithDetails[];
  purchaseOrders: PurchaseOrder[];
}

export function TenantInventorySummary({
  tenantId,
  businessName,
  summary,
  adjustments,
  purchaseOrders,
}: TenantInventorySummaryProps) {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') ?? 'overview';
  const t = useTranslations('admin.inventory');
  const tc = useTranslations('common');

  const tabs = [
    { id: 'overview', label: t('tabs.overview') },
    { id: 'adjustments', label: t('tabs.adjustments') },
    { id: 'purchase-orders', label: t('tabs.purchaseOrders') },
  ] as const;

  return (
    <DetailPageFrame
      title={t('title', { businessName })}
      description={t('description')}
      backHref="/merchants?status=APPROVED"
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
            href={`/inventory/tenants/${tenantId}?tab=${item.id}`}
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
      ) : null}

      {tab === 'purchase-orders' ? (
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
      ) : null}
    </DetailPageFrame>
  );
}
