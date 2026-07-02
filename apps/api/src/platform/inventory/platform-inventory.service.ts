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
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
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
        const threshold = thresholdByVariant.get(sl.variantId) ?? defaultThreshold;
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
    limit = 50,
    from?: string,
    to?: string,
  ) {
    const where: Prisma.StockAdjustmentWhereInput = { tenantId };
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const items = await this.prisma.stockAdjustment.findMany({
      where,
      take: Math.min(limit, 100),
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
    });

    return {
      data: items.map((a) => this.inventory.mapAdjustment(a)),
      meta: { total: items.length, limit },
    };
  }

  
  async listPurchaseOrders(tenantId: string, status?: string, limit = 50) {
    const where: Prisma.PurchaseOrderWhereInput = { tenantId };
    if (status) {
      where.status = status as Prisma.EnumPurchaseOrderStatusFilter['equals'];
    }

    const items = await this.prisma.purchaseOrder.findMany({
      where,
      take: Math.min(limit, 100),
      orderBy: { createdAt: 'desc' },
      include: {
        warehouse: { select: { id: true, name: true } },
        createdBy: { select: { id: true, email: true } },
      },
    });

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
      meta: { total: items.length, limit },
    };
  }
}
