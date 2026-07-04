'use client';

import { useTranslations } from 'next-intl';
import {
  Badge,
  BentoDetailHero,
  DetailPageFrame,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@meridian/ui';
import type { StockTransferWithDetails } from '@meridian/shared';

interface TransferDetailProps {
  transfer: StockTransferWithDetails;
  token: string;
}

const statusVariant: Record<string, 'default' | 'secondary' | 'success' | 'destructive'> = {
  PENDING: 'secondary',
  TRANSFERRED: 'success',
  CANCELLED: 'destructive',
};

export function TransferDetail({ transfer: tr, token }: TransferDetailProps) {
  const t = useTranslations('merchant.inventory.transfers');

  const totalQty = tr.lines.reduce((sum, l) => sum + l.quantity, 0);

  function statusLabel(status: string): string {
    if (status === 'PENDING' || status === 'TRANSFERRED' || status === 'CANCELLED') {
      return t(`status.${status as 'PENDING' | 'TRANSFERRED' | 'CANCELLED'}`);
    }
    return status;
  }

  return (
    <DetailPageFrame
      title={t('title')}
      description={
        tr.note
          ? `${tr.fromWarehouse.name} → ${tr.toWarehouse.name} · ${tr.note}`
          : `${tr.fromWarehouse.name} → ${tr.toWarehouse.name}`
      }
      backHref="/inventory/transfers"
      backLabel={t('title')}
      badges={
        <Badge variant={statusVariant[tr.status] ?? 'secondary'}>
          {statusLabel(tr.status)}
        </Badge>
      }
    >
      <BentoDetailHero
        metrics={[
          { title: t('fromWarehouse'), value: tr.fromWarehouse.name },
          { title: t('toWarehouse'), value: tr.toWarehouse.name },
          { title: t('lines'), value: tr.lines.length },
          { title: t('quantity'), value: totalQty },
        ]}
      />

      <div className="rounded-xl ring-1 ring-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('variant')}</TableHead>
              <TableHead className="text-right">{t('quantity')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tr.lines.map((line) => (
              <TableRow key={line.id}>
                <TableCell>
                  <div className="font-medium">{line.variant.name}</div>
                  <div className="font-mono text-xs text-muted-foreground">
                    {line.variant.sku}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {line.variant.productName}
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono text-sm tabular-nums">
                  {line.quantity}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        <p>
          {t('created')}: {new Date(tr.createdAt).toLocaleString()}
        </p>
        <p>
          {t('createdBy')}: {tr.createdBy.email}
        </p>
      </div>
    </DetailPageFrame>
  );
}
