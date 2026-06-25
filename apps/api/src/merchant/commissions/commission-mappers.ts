import type { CommissionLedger, Distributor, Order, SettlementBatch } from '@prisma/client';
import type { CommissionStatementRow } from '@meridian/shared';

export function formatOrderReference(orderId: string): string {
  return orderId.slice(-8).toUpperCase();
}

export function formatSettlementBatchPeriod(
  batch: Pick<SettlementBatch, 'periodStart' | 'periodEnd'> | null | undefined,
): string | null {
  if (!batch) return null;
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return `${fmt(batch.periodStart)} — ${fmt(batch.periodEnd)}`;
}

type LedgerWithRelations = CommissionLedger & {
  order: Pick<Order, 'total'>;
  distributor: Pick<Distributor, 'id' | 'name' | 'commissionType' | 'commissionRate'>;
  settlementBatch: SettlementBatch | null;
};

export function mapCommissionStatementRow(
  entry: LedgerWithRelations,
): CommissionStatementRow {
  return {
    id: entry.id,
    orderId: entry.orderId,
    orderReference: formatOrderReference(entry.orderId),
    orderTotal: entry.order.total.toString(),
    distributorId: entry.distributorId,
    distributorName: entry.distributor.name,
    commissionType: entry.distributor.commissionType,
    commissionRate: entry.distributor.commissionRate.toString(),
    amount: entry.amount.toString(),
    status: entry.status as CommissionStatementRow['status'],
    settlementBatchId: entry.settlementBatchId,
    settlementBatchPeriod: formatSettlementBatchPeriod(entry.settlementBatch),
    createdAt: entry.createdAt.toISOString(),
  };
}

export function decimalSumToString(
  value: { toString(): string } | null | undefined,
): string {
  if (value == null) return '0';
  return value.toString();
}
