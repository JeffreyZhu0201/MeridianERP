'use client';

import { Fragment, useState } from 'react';
import { useTranslations } from 'next-intl';
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
    lineSku: string;
    lineQty: string;
    linePrice: string;
    expandLines: string;
    collapseLines: string;
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const t = useTranslations('admin.allocations');

  function statusLabel(status: string): string {
    if (status === 'DRAFT' || status === 'ISSUED' || status === 'CONFIRMED' || status === 'CANCELLED') {
      return t(`orderStatus.${status}`);
    }
    return status;
  }

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
                  const isExpanded = expandedId === order.id;

                  return (
                    <Fragment key={order.id}>
                      <TableRow>
                        <TableCell>
                          {order.tenant?.merchantProfile?.businessName ?? order.tenantId}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{statusLabel(order.status)}</Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-auto px-2 py-1"
                            onClick={() => setExpandedId(isExpanded ? null : order.id)}
                          >
                            {order.lines.length}{' '}
                            <span className="text-muted-foreground">
                              {isExpanded ? labels.collapseLines : labels.expandLines}
                            </span>
                          </Button>
                        </TableCell>
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
                      {isExpanded ? (
                        <TableRow>
                          <TableCell colSpan={6} className="bg-muted/30 p-4">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>{labels.lineSku}</TableHead>
                                  <TableHead className="text-right">{labels.lineQty}</TableHead>
                                  <TableHead className="text-right">{labels.linePrice}</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {order.lines.map((line) => (
                                  <TableRow key={line.id}>
                                    <TableCell className="font-mono text-xs">
                                      {line.masterSku?.skuCode ?? line.masterSkuId}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">
                                      {line.quantity}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">
                                      {formatMoney(line.wholesalePrice)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </Fragment>
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
