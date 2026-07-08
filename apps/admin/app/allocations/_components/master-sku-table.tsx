'use client';

import { Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  formatMoney,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow, } from '@meridian/ui/server';

import type { MasterSku } from '@/lib/api';

function primaryImageUrl(sku: MasterSku): string | null {
  const images = sku.images ?? [];
  if (images.length === 0) return null;
  const primary = images.find((image) => image.isPrimary);
  return primary?.url ?? images[0]?.url ?? null;
}

interface MasterSkuTableProps {
  masterSkus: MasterSku[];
  labels: {
    title: string;
    create: string;
    syncAll: string;
    empty: string;
    thumbnail: string;
    code: string;
    name: string;
    onHand: string;
    wholesale: string;
    retail: string;
    flagship: string;
    syncStatus: string;
    synced: string;
    notSynced: string;
    actions: string;
    edit: string;
  };
  onCreate: () => void;
  onEdit: (sku: MasterSku) => void;
  onSyncAll: () => void;
}

export function MasterSkuTable({
  masterSkus,
  labels,
  onCreate,
  onEdit,
  onSyncAll,
}: MasterSkuTableProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>{labels.title}</CardTitle>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onSyncAll}>
            {labels.syncAll}
          </Button>
          <Button size="sm" onClick={onCreate}>
            {labels.create}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {masterSkus.length === 0 ? (
          <EmptyState title={labels.empty} />
        ) : (
          <div className="rounded-xl ring-1 ring-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">{labels.thumbnail}</TableHead>
                  <TableHead>{labels.code}</TableHead>
                  <TableHead>{labels.name}</TableHead>
                  <TableHead className="text-right">{labels.onHand}</TableHead>
                  <TableHead className="text-right">{labels.wholesale}</TableHead>
                  <TableHead className="text-right">{labels.retail}</TableHead>
                  <TableHead className="text-right">{labels.flagship}</TableHead>
                  <TableHead>{labels.syncStatus}</TableHead>
                  <TableHead className="text-right">{labels.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {masterSkus.map((sku) => {
                  const imageUrl = primaryImageUrl(sku);
                  return (
                    <TableRow key={sku.id}>
                      <TableCell>
                        {imageUrl ? (
                          <div className="size-10 overflow-hidden rounded-md bg-muted/40">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={imageUrl}
                              alt={sku.name}
                              className="size-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="size-10 rounded-md bg-muted/40" aria-hidden />
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{sku.skuCode}</TableCell>
                      <TableCell>{sku.name}</TableCell>
                      <TableCell className="text-right tabular-nums">{sku.quantityOnHand}</TableCell>
                      <TableCell className="text-right">{formatMoney(sku.wholesalePrice)}</TableCell>
                      <TableCell className="text-right">{formatMoney(sku.retailPrice)}</TableCell>
                      <TableCell className="text-right">{formatMoney(sku.flagshipPrice)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {sku.synced ? labels.synced : labels.notSynced}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => onEdit(sku)}>
                          {labels.edit}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
