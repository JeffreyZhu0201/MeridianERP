import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { InventoryService } from '../../inventory/inventory.service';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * 平台库存服务 - 提供跨租户的库存查看功能
 *
 * 功能范围：
 * - 查看商户租户的库存汇总（仓库、SKU、低库存统计）
 * - 查询库存调整记录
 * - 查询采购订单
 *
 * 注意：此服务主要用于平台管理员查看商户库存，
 * 不直接处理库存变动（变动由商户自身服务处理）
 */
@Injectable()
export class PlatformInventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
  ) {}

  /**
   * 获取商户库存汇总
   *
   * 汇总信息包括：
   * - 仓库数量和详细信息
   * - SKU 种类数
   * - 库存总单位数
   * - 低库存商品数量（低于各自阈值）
   *
   * @param tenantId - 商户租户 ID
   * @returns 库存汇总（租户不存在返回 null）
   */
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

  /**
   * 查询库存调整记录
   *
   * @param tenantId - 商户租户 ID
   * @param limit - 返回数量上限（默认50，最大100）
   * @param from - 起始日期（可选，ISO 格式）
   * @param to - 结束日期（可选，ISO 格式）
   * @returns 库存调整记录分页列表
   */
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

  /**
   * 查询采购订单列表
   *
   * @param tenantId - 商户租户 ID
   * @param status - 可选，按状态筛选
   * @param limit - 返回数量上限（默认50，最大100）
   * @returns 采购订单分页列表
   */
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
