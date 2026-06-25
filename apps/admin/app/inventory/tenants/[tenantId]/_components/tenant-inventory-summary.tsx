'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Badge,
  Card,
  CardContent,
  DetailPageFrame,
  MetricCard,
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

  return (
    <DetailPageFrame
      title={`${businessName} — Inventory`}
      description="Read-only support view"
      backHref="/merchants"
      backLabel="Merchants"
    >
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
        Read-only support view. Changes must be made by the merchant.
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Warehouses" value={summary.warehouseCount} />
        <MetricCard title="SKUs" value={summary.skuCount} />
        <MetricCard title="Units on hand" value={summary.totalUnitsOnHand.toLocaleString()} />
        <MetricCard title="Low stock" value={summary.lowStockCount} />
      </div>

      <div className="flex gap-2 border-b">
        {(['overview', 'adjustments', 'purchase-orders'] as const).map((t) => (
          <Link
            key={t}
            href={`/inventory/tenants/${tenantId}?tab=${t}`}
            className={`border-b-2 px-4 py-2 text-sm font-medium capitalize ${
              tab === t
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'purchase-orders' ? 'Recent POs' : t === 'adjustments' ? 'Recent adjustments' : 'Overview'}
          </Link>
        ))}
      </div>

      {tab === 'overview' ? (
        <Card>
          <CardContent className="p-0 pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Default</TableHead>
                  <TableHead className="text-right">SKUs</TableHead>
                  <TableHead className="text-right">Units</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.warehouses.map((wh) => (
                  <TableRow key={wh.id}>
                    <TableCell className="font-medium">{wh.name}</TableCell>
                    <TableCell>
                      {wh.isDefault ? <Badge variant="outline">Default</Badge> : '—'}
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
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Delta</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Actor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adjustments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No recent adjustments
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
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO #</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchaseOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No recent purchase orders
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
