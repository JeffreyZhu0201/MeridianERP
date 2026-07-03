import type {
  AllocationOrder,
  AllocationOrderLine,
  CommissionLedger,
  Distributor,
  Order,
  SettlementBatch,
} from '@prisma/client';
import type { CommissionStatementRow } from '@meridian/shared';
import { sumAllocationLineCost } from '@meridian/shared';

export function formatOrderReference(sourceId: string): string {
  return sourceId.slice(-8).toUpperCase();
}

export function formatSettlementBatchPeriod(
  batch: Pick<SettlementBatch, 'periodStart' | 'periodEnd'> | null | undefined,
): string | null {
  if (!batch) return null;
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return `${fmt(batch.periodStart)} — ${fmt(batch.periodEnd)}`;
}

type LedgerWithRelations = CommissionLedger & {
  order: Pick<Order, 'total'> | null;
  allocationOrder:
    | (Pick<AllocationOrder, 'id'> & {
        lines: Array<Pick<AllocationOrderLine, 'quantity' | 'wholesalePrice'>>;
      })
    | null;
  distributor: Pick<Distributor, 'id' | 'name' | 'commissionType' | 'commissionRate'>;
  settlementBatch: SettlementBatch | null;
  tenant?: {
    merchantProfile: { businessName: string } | null;
  } | null;
};

function resolveOrderTotal(entry: LedgerWithRelations): string {
  if (entry.order) {
    return entry.order.total.toString();
  }
  if (entry.allocationOrder?.lines?.length) {
    return sumAllocationLineCost(entry.allocationOrder.lines).toFixed(2);
  }
  return '0';
}

function resolveReferenceId(entry: LedgerWithRelations): string {
  if (entry.allocationOrderId) return entry.allocationOrderId;
  if (entry.orderId) return entry.orderId;
  return entry.id;
}

export function mapCommissionStatementRow(
  entry: LedgerWithRelations,
): CommissionStatementRow {
  const referenceId = resolveReferenceId(entry);
  return {
    id: entry.id,
    orderId: entry.orderId,
    allocationOrderId: entry.allocationOrderId,
    orderReference: formatOrderReference(referenceId),
    orderTotal: resolveOrderTotal(entry),
    businessName: entry.tenant?.merchantProfile?.businessName ?? null,
    distributorId: entry.distributorId,
    distributorName: entry.distributor.name,
    commissionType: entry.distributor.commissionType,
    commissionRate: entry.distributor.commissionRate.toString(),
    amount: entry.amount.toString(),
    status: entry.status as CommissionStatementRow['status'],
    customerOrderSequence: entry.customerOrderSequence ?? null,
    merchantAllocationSequence: entry.merchantAllocationSequence ?? null,
    commissionSource: entry.commissionSource ?? null,
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
