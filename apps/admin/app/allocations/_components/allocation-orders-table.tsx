import {
  Badge,
  Button,
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
  TableRow,
} from '@meridian/ui';

import type { AllocationOrder } from '@/lib/api';

interface AllocationOrdersTableProps {
  allocations: AllocationOrder[];
  canCreate: boolean;
  locale: string;
  labels: {
    title: string;
    create: string;
    empty: string;
    merchant: string;
    status: string;
    lines: string;
    total: string;
    created: string;
    actions: string;
    issue: string;
  };
  onCreate: () => void;
  onIssue: (id: string) => void;
}

export function AllocationOrdersTable({
  allocations,
  canCreate,
  locale,
  labels,
  onCreate,
  onIssue,
}: AllocationOrdersTableProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>{labels.title}</CardTitle>
        <Button size="sm" onClick={onCreate} disabled={!canCreate}>
          {labels.create}
        </Button>
      </CardHeader>
      <CardContent>
        {allocations.length === 0 ? (
          <EmptyState title={labels.empty} />
        ) : (
          <div className="rounded-xl ring-1 ring-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{labels.merchant}</TableHead>
                  <TableHead>{labels.status}</TableHead>
                  <TableHead className="text-right">{labels.lines}</TableHead>
                  <TableHead className="text-right">{labels.total}</TableHead>
                  <TableHead>{labels.created}</TableHead>
                  <TableHead className="text-right">{labels.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allocations.map((order) => {
                  const total = order.lines.reduce(
                    (sum, line) => sum + Number(line.wholesalePrice) * line.quantity,
                    0,
                  );

                  return (
                    <TableRow key={order.id}>
                      <TableCell>
                        {order.tenant?.merchantProfile?.businessName ?? order.tenantId}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{order.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{order.lines.length}</TableCell>
                      <TableCell className="text-right">{formatMoney(total)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString(locale)}
                      </TableCell>
                      <TableCell className="text-right">
                        {order.status === 'DRAFT' ? (
                          <Button size="sm" onClick={() => onIssue(order.id)}>
                            {labels.issue}
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
      </CardContent>
    </Card>
  );
}
