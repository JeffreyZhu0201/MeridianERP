import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { InventoryService } from '../../inventory/inventory.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PlatformInventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
  ) {}

  async getTenantSummary(tenantId: string) {
    await this.inventory.migrateTenantInventory(tenantId);
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) {
      return null;
    }

    const warehouses = await this.prisma.warehouse.findMany({
      where: { tenantId },
      include: {
        stockLevels: { select: { quantityOnHand: true, variantId: true } },
      },
    });

    const settings = await this.prisma.tenantInventorySettings.findUnique({
      where: { tenantId },
    });
    const defaultThreshold = settings?.defaultReorderThreshold ?? 5;

    const defaultWarehouse = warehouses.find((w) => w.isDefault);
    let lowStockCount = 0;
    if (defaultWarehouse) {
      const variants = await this.prisma.productVariant.findMany({
        where: { product: { tenantId } },
        select: { id: true, reorderThreshold: true },
      });
      const thresholdByVariant = new Map(
        variants.map((v) => [v.id, v.reorderThreshold ?? defaultThreshold]),
      );
      for (const sl of defaultWarehouse.stockLevels) {
        const threshold =
          thresholdByVariant.get(sl.variantId) ?? defaultThreshold;
        if (sl.quantityOnHand <= threshold) lowStockCount++;
      }
    }

    const skuIds = new Set<string>();
    let totalUnitsOnHand = 0;
    const warehouseSummaries = warehouses.map((w) => {
      const units = w.stockLevels.reduce((s, sl) => s + sl.quantityOnHand, 0);
      w.stockLevels.forEach((sl) => skuIds.add(sl.variantId));
      totalUnitsOnHand += units;
      return {
        id: w.id,
        name: w.name,
        isDefault: w.isDefault,
        skuCount: new Set(w.stockLevels.map((sl) => sl.variantId)).size,
        unitsOnHand: units,
      };
    });

    return {
      tenantId,
      warehouseCount: warehouses.length,
      skuCount: skuIds.size,
      totalUnitsOnHand,
      lowStockCount,
      warehouses: warehouseSummaries,
    };
  }

  async listAdjustments(
    tenantId: string,
    query: { page?: number; limit?: number; from?: string; to?: string } = {},
  ) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 50));
    const skip = (page - 1) * limit;

    const where: Prisma.StockAdjustmentWhereInput = { tenantId };
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) where.createdAt.lte = new Date(query.to);
    }

    const [items, total] = await Promise.all([
      this.prisma.stockAdjustment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: { select: { id: true, email: true } },
          warehouse: { select: { id: true, name: true } },
          variant: {
            select: {
              id: true,
              sku: true,
              name: true,
              product: { select: { name: true } },
            },
          },
        },
      }),
      this.prisma.stockAdjustment.count({ where }),
    ]);

    return {
      data: items.map((a) => this.inventory.mapAdjustment(a)),
      meta: { total, page, limit },
    };
  }

  async listPurchaseOrders(
    tenantId: string,
    query: { page?: number; status?: string; limit?: number } = {},
  ) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 50));
    const skip = (page - 1) * limit;

    const where: Prisma.PurchaseOrderWhereInput = { tenantId };
    if (query.status) {
      where.status =
        query.status as Prisma.EnumPurchaseOrderStatusFilter['equals'];
    }

    const [items, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          warehouse: { select: { id: true, name: true } },
          createdBy: { select: { id: true, email: true } },
        },
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);

    return {
      data: items.map((po) => ({
        id: po.id,
        tenantId: po.tenantId,
        warehouseId: po.warehouseId,
        supplierName: po.supplierName,
        status: po.status,
        poNumber: po.poNumber,
        createdById: po.createdById,
        orderedAt: po.orderedAt?.toISOString() ?? null,
        createdAt: po.createdAt.toISOString(),
        updatedAt: po.updatedAt.toISOString(),
        warehouse: po.warehouse,
        createdBy: po.createdBy,
      })),
      meta: { total, page, limit },
    };
  }
}
