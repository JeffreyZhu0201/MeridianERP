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
 *
 * 核心概念：
 * - StockLevel：仓库中每个 SKU 变体的实际库存数量
 * - ProductVariant.inventory：用于门店展示的可售库存（缓存字段）
 * - 库存变动后自动同步缓存
 */
export interface StockMutationResult {
  stockLevelId: string;
  quantityBefore: number;
  quantityAfter: number;
  sellableInventory: number;
}

/**
 * 事务客户端类型别名
 * 允许在事务内外复用数据库操作
 */
type TxClient = Prisma.TransactionClient;

/**
 * 库存服务
 *
 * 功能范围：
 * - 仓库管理（默认仓库创建/迁移）
 * - 库存水平查询和变动
 * - 库存调整（报损、盘点、退货等）
 * - 库存调拨（仓库间转移）
 * - 采购单收货
 * - 可售数量缓存同步
 * - 订单付款后扣减库存
 */
@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryQueue: InventoryQueueService,
  ) {}

  /**
   * 查询变体的可售库存（缓存字段）
   *
   * 用于门店展示的可售数量，从 ProductVariant.inventory 读取
   * 注意：这是缓存值，可能与实际仓库库存不完全同步
   *
   * @param variantId - SKU 变体 ID
   * @returns 可售库存数量
   */
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

  /**
   * 为新建变体在默认仓库初始化库存水平
   *
   * @param tenantId - 租户 ID
   * @param variantId - 变体 ID
   * @param quantity - 初始数量
   */
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

  /**
   * 确保租户具备默认仓库与库存设置（幂等迁移）
   *
   * 在以下场景调用：
   * - 商户创建时
   * - 新建变体时
   * - 任何需要确保仓库存在的操作前
   *
   * 流程：
   * 1. 创建 TenantInventorySettings（如果不存在）
   * 2. 创建默认仓库（如果不存在）
   * 3. 为所有现有变体创建 StockLevel 记录
   *
   * @param tenantId - 租户 ID
   */
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

  /**
   * 同步变体的可售缓存
   *
   * 从默认仓库的 StockLevel 读取实际库存
   * 更新到 ProductVariant.inventory 缓存字段
   *
   * 所有库存变动后必须调用此方法保持缓存一致
   *
   * @param variantId - 变体 ID
   * @param tx - 可选事务客户端
   * @returns 同步后的可售数量
   */
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

  /**
   * 库存调整
   *
   * 支持的调整原因：
   * - DAMAGE：损坏
   * - COUNT_CORRECTION：盘点修正
   * - RETURN：退货
   * - OTHER：其他（需提供备注）
   * - TRANSFER_OUT/TRANSFER_IN：调拨（通过 applyTransferLineInTx）
   *
   * @param tenantId - 租户 ID
   * @param warehouseId - 仓库 ID
   * @param variantId - 变体 ID
   * @param delta - 库存变动量（正数增加，负数减少）
   * @param reason - 调整原因
   * @param note - 备注（OTHER 原因必填）
   * @param actorId - 操作人 ID
   * @returns 调整记录
   */
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

  /**
   * 仓库间调拨（在同一事务中执行）
   *
   * @param tx - 事务客户端
   * @param params - 调拨参数
   */
  async applyTransferLineInTx(
    tx: TxClient,
    params: {
      tenantId: string;
      fromWarehouseId: string;
      toWarehouseId: string;
      variantId: string;
      quantity: number;
      actorId: string;
      note?: string | null;
    },
  ): Promise<void> {
    const {
      tenantId,
      fromWarehouseId,
      toWarehouseId,
      variantId,
      quantity,
      actorId,
      note,
    } = params;

    if (quantity <= 0 || !Number.isInteger(quantity)) {
      throw new BadRequestException('Transfer quantity must be a positive integer');
    }

    await this.assertVariantInTenant(tx, tenantId, variantId);
    await this.assertWarehouseInTenant(tx, tenantId, fromWarehouseId);
    await this.assertWarehouseInTenant(tx, tenantId, toWarehouseId);

    const outMutation = await this.applyQuantityDelta(
      tx,
      tenantId,
      fromWarehouseId,
      variantId,
      -quantity,
    );

    const inMutation = await this.applyQuantityDelta(
      tx,
      tenantId,
      toWarehouseId,
      variantId,
      quantity,
    );

    await tx.stockAdjustment.create({
      data: {
        tenantId,
        warehouseId: fromWarehouseId,
        variantId,
        actorId,
        reason: StockAdjustmentReason.TRANSFER_OUT,
        note: note ?? null,
        quantityDelta: -quantity,
        quantityBefore: outMutation.quantityBefore,
        quantityAfter: outMutation.quantityAfter,
      },
    });

    await tx.stockAdjustment.create({
      data: {
        tenantId,
        warehouseId: toWarehouseId,
        variantId,
        actorId,
        reason: StockAdjustmentReason.TRANSFER_IN,
        note: note ?? null,
        quantityDelta: quantity,
        quantityBefore: inMutation.quantityBefore,
        quantityAfter: inMutation.quantityAfter,
      },
    });

    await this.syncVariantInventoryCache(variantId, tx);
  }

  /**
   * 采购单收货，增加库存
   *
   * @param tenantId - 租户 ID
   * @param warehouseId - 仓库 ID
   * @param variantId - 变体 ID
   * @param quantity - 收货数量
   * @param tx - 可选事务客户端
   * @returns 库存变动结果
   */
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

  /**
   * 订单付款后扣减库存
   *
   * 注意：此方法在订单状态变为 PAID 时调用
   * 但 Phase 5 实际在履约时才扣减库存
   *
   * @param orderId - 订单 ID
   */
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

  /**
   * 在外部事务中扣减订单库存
   *
   * 用于需要保持事务一致性的场景（如创建订单+扣库存）
   *
   * @param orderId - 订单 ID
   * @param tx - 外部事务客户端
   */
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

  /**
   * 根据采购单行项计算采购单状态
   *
   * 状态推导规则：
   * - CANCELLED → 保持取消状态
   * - 总收货 = 0 → DRAFT 或 ORDERED
   * - 总收货 >= 总订购 → RECEIVED
   * - 其他 → PARTIALLY_RECEIVED
   *
   * @param lines - 采购单行项
   * @param current - 当前状态
   * @returns 推导后的状态
   */
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

  /**
   * 获取有效的重订货阈值
   *
   * 优先级：变体自定义阈值 > 租户默认阈值 > 5
   *
   * @param tenantId - 租户 ID
   * @param variantId - 变体 ID
   * @returns 重订货阈值
   */
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

  /**
   * 在事务中应用库存变动（公开包装器）
   */
  async applyQuantityDeltaInTx(
    tx: TxClient,
    tenantId: string,
    warehouseId: string,
    variantId: string,
    delta: number,
  ): Promise<StockMutationResult> {
    return this.applyQuantityDelta(tx, tenantId, warehouseId, variantId, delta);
  }

  /**
   * 应用库存变动核心逻辑
   *
   * @param tx - 事务客户端
   * @param tenantId - 租户 ID
   * @param warehouseId - 仓库 ID
   * @param variantId - 变体 ID
   * @param delta - 变动量
   * @returns 变动结果
   */
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

  /**
   * 验证变体属于该租户
   */
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

  /**
   * 验证仓库属于该租户且处于活跃状态
   */
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

  /**
   * 映射调整记录为响应格式
   */
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
