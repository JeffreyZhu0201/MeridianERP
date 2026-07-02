interface StockCsvRow {
  warehouse: { name: string };
  variant: {
    sku: string;
    name: string;
    productName: string;
    sellableInventory: number;
  };
  quantityOnHand: number;
}

interface AdjustmentCsvRow {
  createdAt: string;
  warehouse: { name: string };
  variant: { sku: string; name: string };
  reason: string;
  quantityDelta: number;
  quantityBefore: number;
  quantityAfter: number;
  actor: { email: string };
}

function csvValue(value: string | number): string {
  if (typeof value === 'number') return String(value);
  return `"${value.replace(/"/g, '""')}"`;
}

export function buildStockCsv(rows: StockCsvRow[]): string {
  const header =
    'warehouse,sku,variant,product,quantity_on_hand,sellable_inventory';
  const body = rows.map((row) =>
    [
      csvValue(row.warehouse.name),
      csvValue(row.variant.sku),
      csvValue(row.variant.name),
      csvValue(row.variant.productName),
      row.quantityOnHand,
      row.variant.sellableInventory,
    ].join(','),
  );
  return `${header}\n${body.join('\n')}\n`;
}

export function buildAdjustmentsCsv(rows: AdjustmentCsvRow[]): string {
  const header =
    'created_at,warehouse,sku,variant,reason,delta,before,after,actor';
  const body = rows.map((row) =>
    [
      csvValue(row.createdAt),
      csvValue(row.warehouse.name),
      csvValue(row.variant.sku),
      csvValue(row.variant.name),
      csvValue(row.reason),
      row.quantityDelta,
      row.quantityBefore,
      row.quantityAfter,
      csvValue(row.actor.email),
    ].join(','),
  );
  return `${header}\n${body.join('\n')}\n`;
}
