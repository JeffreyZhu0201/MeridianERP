export const INVENTORY_QUEUE = 'inventory';
export const LOW_STOCK_CHECK_JOB = 'low-stock-check';

export const inventoryCacheKeys = {
  lowStock: (tenantId: string) => `inventory:low-stock:${tenantId}`,
  settings: (tenantId: string) => `inventory:settings:${tenantId}`,
};
