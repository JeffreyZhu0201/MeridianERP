import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderStatus,
  Prisma,
  PurchaseOrderStatus,
  StockAdjustmentReason,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryQueueService } from '../queue/inventory-queue.service';

/**
 * 库存领域服务：仓库、库存水平、调整、采购单与可售数量同步。
 * 所有写操作在事务内完成，并异步刷新变体可售缓存。
 */
export interface StockMutationResult {
  stockLevelId: string;
  quantityBefore: number;
  quantityAfter: number;
  sellableInventory: number;
}

type TxClient = Prisma.TransactionClient;

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryQueue: InventoryQueueService,
  ) {}

  /** 查询变体在门店展示用的可售库存（缓存字段） */
  async getSellableQuantity(variantId: string): Promise<number> {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { inventory: true },
    });
    if (!variant) {
      throw new NotFoundException('Variant not found');
    }
    return variant.inventory;
  }

  /** 为新建变体在默认仓库初始化库存水平 */
  async seedVariantStockLevel(
    tenantId: string,
    variantId: string,
    quantity: number,
  ): Promise<void> {
    await this.migrateTenantInventory(tenantId);
    const defaultWarehouse = await this.prisma.warehouse.findFirst({
      where: { tenantId, isDefault: true },
    });
    if (!defaultWarehouse) {
      throw new ConflictException('Default warehouse not configured');
    }

    await this.prisma.stockLevel.upsert({
      where: {
        warehouseId_variantId: {
          warehouseId: defaultWarehouse.id,
          variantId,
        },
      },
      create: {
        tenantId,
        warehouseId: defaultWarehouse.id,
        variantId,
        quantityOnHand: quantity,
      },
      update: { quantityOnHand: quantity },
    });
    await this.syncVariantInventoryCache(variantId);
  }

  /** 确保租户具备默认仓库与库存设置（幂等迁移） */
  async migrateTenantInventory(tenantId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.tenantInventorySettings.upsert({
        where: { tenantId },
        create: { tenantId, defaultReorderThreshold: 5 },
        update: {},
      });

      let defaultWarehouse = await tx.warehouse.findFirst({
        where: { tenantId, isDefault: true },
      });
      if (!defaultWarehouse) {
        defaultWarehouse = await tx.warehouse.create({
          data: {
            tenantId,
            name: 'Default Warehouse',
            isDefault: true,
            isActive: true,
          },
        });
      }

      const variants = await tx.productVariant.findMany({
        where: { product: { tenantId } },
        select: { id: true, inventory: true },
      });

      for (const variant of variants) {
        await tx.stockLevel.upsert({
          where: {
            warehouseId_variantId: {
              warehouseId: defaultWarehouse.id,
              variantId: variant.id,
            },
          },
          create: {
            tenantId,
            warehouseId: defaultWarehouse.id,
            variantId: variant.id,
            quantityOnHand: variant.inventory,
          },
          update: {},
        });
      }
    });
  }

  async syncVariantInventoryCache(
    variantId: string,
    tx?: TxClient,
  ): Promise<number> {
    const client = tx ?? this.prisma;
    const variant = await client.productVariant.findUnique({
      where: { id: variantId },
      include: { product: { select: { tenantId: true } } },
    });
    if (!variant) {
      throw new NotFoundException('Variant not found');
    }

    const defaultWarehouse = await client.warehouse.findFirst({
      where: { tenantId: variant.product.tenantId, isDefault: true },
    });
    if (!defaultWarehouse) {
      throw new ConflictException('Default warehouse not configured');
    }

    const stockLevel = await client.stockLevel.findUnique({
      where: {
        warehouseId_variantId: {
          warehouseId: defaultWarehouse.id,
          variantId,
        },
      },
    });

    const sellable = stockLevel?.quantityOnHand ?? 0;
    await client.productVariant.update({
      where: { id: variantId },
      data: { inventory: sellable },
    });
    return sellable;
  }

  async adjustStock(
    tenantId: string,
    warehouseId: string,
    variantId: string,
    delta: number,
    reason: StockAdjustmentReason,
    note: string | undefined,
    actorId: string,
  ) {
    if (!delta || !Number.isInteger(delta)) {
      throw new BadRequestException('quantityDelta must be a non-zero integer');
    }
    if (reason === StockAdjustmentReason.OTHER && !note?.trim()) {
      throw new BadRequestException('Note is recommended when reason is OTHER');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      await this.assertVariantInTenant(tx, tenantId, variantId);
      await this.assertWarehouseInTenant(tx, tenantId, warehouseId);

      const mutation = await this.applyQuantityDelta(
        tx,
        tenantId,
        warehouseId,
        variantId,
        delta,
      );

      const adjustment = await tx.stockAdjustment.create({
        data: {
          tenantId,
          warehouseId,
          variantId,
          actorId,
          reason,
          note: note ?? null,
          quantityDelta: delta,
          quantityBefore: mutation.quantityBefore,
          quantityAfter: mutation.quantityAfter,
        },
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

      const sellable = await this.syncVariantInventoryCache(variantId, tx);
      return { adjustment, sellable };
    });

    await this.inventoryQueue.enqueueLowStockCheck({ tenantId, variantId, warehouseId });
    return this.mapAdjustment(result.adjustment);
  }

  async incrementFromReceive(
    tenantId: string,
    warehouseId: string,
    variantId: string,
    quantity: number,
    tx?: TxClient,
  ): Promise<StockMutationResult> {
    if (quantity <= 0 || !Number.isInteger(quantity)) {
      throw new BadRequestException('quantityReceived must be a positive integer');
    }

    const run = async (client: TxClient) => {
      await this.assertVariantInTenant(client, tenantId, variantId);
      await this.assertWarehouseInTenant(client, tenantId, warehouseId);

      const mutation = await this.applyQuantityDelta(
        client,
        tenantId,
        warehouseId,
        variantId,
        quantity,
      );
      const sellable = await this.syncVariantInventoryCache(variantId, client);
      return { ...mutation, sellableInventory: sellable };
    };

    if (tx) {
      return run(tx);
    }
    const result = await this.prisma.$transaction(run);
    await this.inventoryQueue.enqueueLowStockCheck({ tenantId, variantId, warehouseId });
    return result;
  }

  async decrementForOrder(orderId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { lines: true },
    });
    if (!order || order.status !== OrderStatus.PAID) {
      return;
    }

    const defaultWarehouse = await this.prisma.warehouse.findFirst({
      where: { tenantId: order.tenantId, isDefault: true },
    });
    if (!defaultWarehouse) {
      throw new ConflictException('Default warehouse not configured');
    }

    await this.prisma.$transaction(async (tx) => {
      for (const line of order.lines) {
        if (!line.variantId) continue;
        await this.applyQuantityDelta(
          tx,
          order.tenantId,
          defaultWarehouse.id,
          line.variantId,
          -line.quantity,
        );
        await this.syncVariantInventoryCache(line.variantId, tx);
      }
    });

    await this.inventoryQueue.enqueueLowStockCheck({
      tenantId: order.tenantId,
      warehouseId: defaultWarehouse.id,
    });
  }

  async markOrderPaidAndDecrement(orderId: string, tx: TxClient): Promise<void> {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { lines: true },
    });
    if (!order) return;

    const defaultWarehouse = await tx.warehouse.findFirst({
      where: { tenantId: order.tenantId, isDefault: true },
    });
    if (!defaultWarehouse) {
      throw new ConflictException('Default warehouse not configured');
    }

    for (const line of order.lines) {
      if (!line.variantId) continue;
      await this.applyQuantityDelta(
        tx,
        order.tenantId,
        defaultWarehouse.id,
        line.variantId,
        -line.quantity,
      );
      await this.syncVariantInventoryCache(line.variantId, tx);
    }
  }

  derivePurchaseOrderStatus(
    lines: Array<{ quantityOrdered: number; quantityReceived: number }>,
    current: PurchaseOrderStatus,
  ): PurchaseOrderStatus {
    if (current === PurchaseOrderStatus.CANCELLED) {
      return current;
    }
    const totalOrdered = lines.reduce((s, l) => s + l.quantityOrdered, 0);
    const totalReceived = lines.reduce((s, l) => s + l.quantityReceived, 0);
    if (totalReceived === 0) {
      return current === PurchaseOrderStatus.DRAFT
        ? PurchaseOrderStatus.DRAFT
        : PurchaseOrderStatus.ORDERED;
    }
    if (totalReceived >= totalOrdered) {
      return PurchaseOrderStatus.RECEIVED;
    }
    return PurchaseOrderStatus.PARTIALLY_RECEIVED;
  }

  async getEffectiveReorderThreshold(
    tenantId: string,
    variantId: string,
  ): Promise<number> {
    const [settings, variant] = await Promise.all([
      this.prisma.tenantInventorySettings.findUnique({ where: { tenantId } }),
      this.prisma.productVariant.findFirst({
        where: { id: variantId, product: { tenantId } },
        select: { reorderThreshold: true },
      }),
    ]);
    if (!variant) {
      throw new NotFoundException('Variant not found');
    }
    return variant.reorderThreshold ?? settings?.defaultReorderThreshold ?? 5;
  }

  private async applyQuantityDelta(
    tx: TxClient,
    tenantId: string,
    warehouseId: string,
    variantId: string,
    delta: number,
  ): Promise<StockMutationResult> {
    const stockLevel = await tx.stockLevel.upsert({
      where: {
        warehouseId_variantId: { warehouseId, variantId },
      },
      create: {
        tenantId,
        warehouseId,
        variantId,
        quantityOnHand: 0,
      },
      update: {},
    });

    const quantityBefore = stockLevel.quantityOnHand;
    const quantityAfter = quantityBefore + delta;
    if (quantityAfter < 0) {
      throw new BadRequestException('Insufficient stock for this operation');
    }

    const updated = await tx.stockLevel.update({
      where: { id: stockLevel.id },
      data: { quantityOnHand: quantityAfter },
    });

    return {
      stockLevelId: updated.id,
      quantityBefore,
      quantityAfter,
      sellableInventory: quantityAfter,
    };
  }

  private async assertVariantInTenant(
    tx: TxClient,
    tenantId: string,
    variantId: string,
  ) {
    const variant = await tx.productVariant.findFirst({
      where: { id: variantId, product: { tenantId } },
    });
    if (!variant) {
      throw new NotFoundException('Variant not found');
    }
    return variant;
  }

  private async assertWarehouseInTenant(
    tx: TxClient,
    tenantId: string,
    warehouseId: string,
  ) {
    const warehouse = await tx.warehouse.findFirst({
      where: { id: warehouseId, tenantId },
    });
    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }
    if (!warehouse.isActive) {
      throw new BadRequestException('Warehouse is inactive');
    }
    return warehouse;
  }

  mapAdjustment(adjustment: {
    id: string;
    tenantId: string;
    warehouseId: string;
    variantId: string;
    actorId: string;
    reason: StockAdjustmentReason;
    note: string | null;
    quantityDelta: number;
    quantityBefore: number;
    quantityAfter: number;
    createdAt: Date;
    actor: { id: string; email: string };
    warehouse: { id: string; name: string };
    variant: {
      id: string;
      sku: string;
      name: string;
      product: { name: string };
    };
  }) {
    return {
      id: adjustment.id,
      tenantId: adjustment.tenantId,
      warehouseId: adjustment.warehouseId,
      variantId: adjustment.variantId,
      actorId: adjustment.actorId,
      reason: adjustment.reason,
      note: adjustment.note,
      quantityDelta: adjustment.quantityDelta,
      quantityBefore: adjustment.quantityBefore,
      quantityAfter: adjustment.quantityAfter,
      createdAt: adjustment.createdAt.toISOString(),
      actor: adjustment.actor,
      warehouse: adjustment.warehouse,
      variant: {
        id: adjustment.variant.id,
        sku: adjustment.variant.sku,
        name: adjustment.variant.name,
        productName: adjustment.variant.product.name,
      },
    };
  }
}
