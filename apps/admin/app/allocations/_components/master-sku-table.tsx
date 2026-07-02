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

interface MasterSkuTableProps {
  masterSkus: MasterSku[];
  labels: {
    title: string;
    create: string;
    empty: string;
    code: string;
    name: string;
    onHand: string;
    wholesale: string;
    retail: string;
    actions: string;
    edit: string;
  };
  onCreate: () => void;
  onEdit: (sku: MasterSku) => void;
}

export function MasterSkuTable({
  masterSkus,
  labels,
  onCreate,
  onEdit,
}: MasterSkuTableProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>{labels.title}</CardTitle>
        <Button size="sm" onClick={onCreate}>
          {labels.create}
        </Button>
      </CardHeader>
      <CardContent>
        {masterSkus.length === 0 ? (
          <EmptyState title={labels.empty} />
        ) : (
          <div className="rounded-xl ring-1 ring-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{labels.code}</TableHead>
                  <TableHead>{labels.name}</TableHead>
                  <TableHead className="text-right">{labels.onHand}</TableHead>
                  <TableHead className="text-right">{labels.wholesale}</TableHead>
                  <TableHead className="text-right">{labels.retail}</TableHead>
                  <TableHead className="text-right">{labels.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {masterSkus.map((sku) => (
                  <TableRow key={sku.id}>
                    <TableCell className="font-mono text-xs">{sku.skuCode}</TableCell>
                    <TableCell>{sku.name}</TableCell>
                    <TableCell className="text-right tabular-nums">{sku.quantityOnHand}</TableCell>
                    <TableCell className="text-right">{formatMoney(sku.wholesalePrice)}</TableCell>
                    <TableCell className="text-right">{formatMoney(sku.retailPrice)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => onEdit(sku)}>
                        {labels.edit}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
