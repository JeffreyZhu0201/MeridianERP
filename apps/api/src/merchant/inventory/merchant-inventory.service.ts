import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  PurchaseOrderStatus,
  StockAdjustmentReason,
} from '@prisma/client';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { InventoryService } from '../../inventory/inventory.service';
import { InventoryQueueService } from '../../queue/inventory-queue.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AdjustmentListQueryDto,
  CreatePurchaseOrderDto,
  CreateStockAdjustmentDto,
  CreateWarehouseDto,
  PurchaseOrderListQueryDto,
  ReceivePurchaseOrderDto,
  StockLevelListQueryDto,
  UpdateInventorySettingsDto,
  UpdatePurchaseOrderDto,
  UpdateReorderThresholdDto,
  UpdateWarehouseDto,
} from './dto/inventory.dto';

/**
 * 商户库存服务 (MerchantInventoryService)
 *
 * 负责商户库存的全面管理，是库存业务的核心服务。
 *
 * 功能模块：
 *
 * 【设置】
 * - 获取/更新库存设置（默认重订货阈值）
 *
 * 【仓库管理】
 * - 仓库列表/详情
 * - 创建/更新仓库（仅业主）
 * - 设置默认仓库
 *
 * 【库存查询】
 * - 库存水平列表（支持仓库/商品变体/关键词筛选）
 * - 库存汇总（按商品变体汇总各仓库库存）
 * - 低库存预警
 *
 * 【库存调整】
 * - 创建库存调整（盘盈/盘亏/其他原因）
 * - 调整记录查询
 *
 * 【采购订单】
 * - 采购订单 CRUD
 * - 提交/取消采购订单
 * - 采购入库（接收货物）
 *
 * 【报表】
 * - 库存报表（支持分页和 CSV 导出）
 * - 调整记录报表（支持 CSV 导出）
 *
 * 权限说明：
 * - 部分操作（如创建仓库、更新设置）仅限 MERCHANT_OWNER 角色
 */
@Injectable()
export class MerchantInventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
    private readonly inventoryQueue: InventoryQueueService,
  ) {}

  private assertOwner(user: AuthenticatedUser) {
    if (!user.roles.includes('MERCHANT_OWNER')) {
      throw new ForbiddenException('Merchant owner role required');
    }
  }

  private paginate(page = 1, limit = 20) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    return { skip: (safePage - 1) * safeLimit, take: safeLimit, page: safePage, limit: safeLimit };
  }

  async getSettings(tenantId: string) {
    await this.inventory.migrateTenantInventory(tenantId);
    const settings = await this.prisma.tenantInventorySettings.findUniqueOrThrow({
      where: { tenantId },
    });
    return {
      tenantId: settings.tenantId,
      defaultReorderThreshold: settings.defaultReorderThreshold,
      createdAt: settings.createdAt.toISOString(),
      updatedAt: settings.updatedAt.toISOString(),
    };
  }

  async updateSettings(user: AuthenticatedUser, dto: UpdateInventorySettingsDto) {
    this.assertOwner(user);
    const settings = await this.prisma.tenantInventorySettings.upsert({
      where: { tenantId: user.tenantId! },
      create: {
        tenantId: user.tenantId!,
        defaultReorderThreshold: dto.defaultReorderThreshold,
      },
      update: { defaultReorderThreshold: dto.defaultReorderThreshold },
    });
    return {
      tenantId: settings.tenantId,
      defaultReorderThreshold: settings.defaultReorderThreshold,
      createdAt: settings.createdAt.toISOString(),
      updatedAt: settings.updatedAt.toISOString(),
    };
  }

  async listWarehouses(tenantId: string) {
    await this.inventory.migrateTenantInventory(tenantId);
    const warehouses = await this.prisma.warehouse.findMany({
      where: { tenantId },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
    return warehouses.map((w) => this.mapWarehouse(w));
  }

  async getWarehouse(tenantId: string, id: string) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id, tenantId },
    });
    if (!warehouse) throw new NotFoundException('Warehouse not found');
    return this.mapWarehouse(warehouse);
  }

  async createWarehouse(user: AuthenticatedUser, dto: CreateWarehouseDto) {
    this.assertOwner(user);
    const tenantId = user.tenantId!;
    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.warehouse.updateMany({
          where: { tenantId, isDefault: true },
          data: { isDefault: false },
        });
      }
      const warehouse = await tx.warehouse.create({
        data: {
          tenantId,
          name: dto.name,
          address: dto.address ?? null,
          isDefault: dto.isDefault ?? false,
        },
      });
      if (!(await tx.warehouse.findFirst({ where: { tenantId, isDefault: true } }))) {
        return tx.warehouse.update({
          where: { id: warehouse.id },
          data: { isDefault: true },
        });
      }
      return warehouse;
    }).then((w) => this.mapWarehouse(w));
  }

  async updateWarehouse(
    user: AuthenticatedUser,
    id: string,
    dto: UpdateWarehouseDto,
  ) {
    this.assertOwner(user);
    await this.getWarehouse(user.tenantId!, id);
    const warehouse = await this.prisma.warehouse.update({
      where: { id },
      data: {
        name: dto.name,
        address: dto.address,
        isActive: dto.isActive,
      },
    });
    return this.mapWarehouse(warehouse);
  }

  async setDefaultWarehouse(user: AuthenticatedUser, id: string) {
    this.assertOwner(user);
    const tenantId = user.tenantId!;
    await this.getWarehouse(tenantId, id);
    await this.prisma.$transaction(async (tx) => {
      await tx.warehouse.updateMany({
        where: { tenantId, isDefault: true },
        data: { isDefault: false },
      });
      await tx.warehouse.update({ where: { id }, data: { isDefault: true } });
    });
    return this.getWarehouse(tenantId, id);
  }

  async listStockLevels(tenantId: string, query: StockLevelListQueryDto) {
    const { skip, take, page, limit } = this.paginate(query.page, query.limit);
    const where: Prisma.StockLevelWhereInput = { tenantId };
    if (query.warehouseId) where.warehouseId = query.warehouseId;
    if (query.variantId) where.variantId = query.variantId;
    if (query.q) {
      where.variant = {
        OR: [
          { sku: { contains: query.q, mode: 'insensitive' } },
          { name: { contains: query.q, mode: 'insensitive' } },
          { product: { name: { contains: query.q, mode: 'insensitive' } } },
        ],
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.stockLevel.findMany({
        where,
        skip,
        take,
        include: {
          warehouse: { select: { id: true, name: true, isDefault: true } },
          variant: {
            select: {
              id: true,
              sku: true,
              name: true,
              productId: true,
              reorderThreshold: true,
              inventory: true,
              product: { select: { name: true } },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.stockLevel.count({ where }),
    ]);

    return {
      data: items.map((sl) => ({
        id: sl.id,
        tenantId: sl.tenantId,
        warehouseId: sl.warehouseId,
        variantId: sl.variantId,
        quantityOnHand: sl.quantityOnHand,
        createdAt: sl.createdAt.toISOString(),
        updatedAt: sl.updatedAt.toISOString(),
        warehouse: sl.warehouse,
        variant: {
          id: sl.variant.id,
          sku: sl.variant.sku,
          name: sl.variant.name,
          productId: sl.variant.productId,
          productName: sl.variant.product.name,
          reorderThreshold: sl.variant.reorderThreshold,
          sellableInventory: sl.variant.inventory,
        },
      })),
      meta: { total, page, limit },
    };
  }

  async stockLevelsSummary(tenantId: string) {
    const levels = await this.prisma.stockLevel.findMany({
      where: { tenantId },
      include: {
        warehouse: { select: { id: true, name: true } },
        variant: {
          select: {
            id: true,
            sku: true,
            name: true,
            productId: true,
            inventory: true,
            product: { select: { name: true } },
          },
        },
      },
    });

    const byVariant = new Map<string, {
      variantId: string;
      sku: string;
      variantName: string;
      productId: string;
      productName: string;
      sellableInventory: number;
      totalOnHand: number;
      byWarehouse: Array<{ warehouseId: string; warehouseName: string; quantityOnHand: number }>;
    }>();

    for (const sl of levels) {
      const existing = byVariant.get(sl.variantId) ?? {
        variantId: sl.variant.id,
        sku: sl.variant.sku,
        variantName: sl.variant.name,
        productId: sl.variant.productId,
        productName: sl.variant.product.name,
        sellableInventory: sl.variant.inventory,
        totalOnHand: 0,
        byWarehouse: [],
      };
      existing.totalOnHand += sl.quantityOnHand;
      existing.byWarehouse.push({
        warehouseId: sl.warehouse.id,
        warehouseName: sl.warehouse.name,
        quantityOnHand: sl.quantityOnHand,
      });
      byVariant.set(sl.variantId, existing);
    }

    return { items: [...byVariant.values()] };
  }

  createAdjustment(user: AuthenticatedUser, dto: CreateStockAdjustmentDto) {
    return this.inventory.adjustStock(
      user.tenantId!,
      dto.warehouseId,
      dto.variantId,
      dto.quantityDelta,
      dto.reason,
      dto.note,
      user.userId,
    );
  }

  async listAdjustments(tenantId: string, query: AdjustmentListQueryDto) {
    const { skip, take, page, limit } = this.paginate(query.page, query.limit);
    const where: Prisma.StockAdjustmentWhereInput = { tenantId };
    if (query.warehouseId) where.warehouseId = query.warehouseId;
    if (query.variantId) where.variantId = query.variantId;
    if (query.reason) where.reason = query.reason;
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) where.createdAt.lte = new Date(query.to);
    }

    const [items, total] = await Promise.all([
      this.prisma.stockAdjustment.findMany({
        where,
        skip,
        take,
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

  async lowStockAlerts(tenantId: string) {
    await this.inventory.migrateTenantInventory(tenantId);
    const settings = await this.prisma.tenantInventorySettings.findUnique({
      where: { tenantId },
    });
    const defaultThreshold = settings?.defaultReorderThreshold ?? 5;

    const defaultWarehouse = await this.prisma.warehouse.findFirst({
      where: { tenantId, isDefault: true },
    });
    if (!defaultWarehouse) return { items: [] };

    const levels = await this.prisma.stockLevel.findMany({
      where: { tenantId, warehouseId: defaultWarehouse.id },
      include: {
        warehouse: { select: { id: true, name: true } },
        variant: {
          select: {
            id: true,
            sku: true,
            name: true,
            productId: true,
            reorderThreshold: true,
            product: { select: { name: true } },
          },
        },
      },
    });

    const items = levels
      .map((sl) => {
        const threshold = sl.variant.reorderThreshold ?? defaultThreshold;
        return {
          variantId: sl.variant.id,
          sku: sl.variant.sku,
          variantName: sl.variant.name,
          productId: sl.variant.productId,
          productName: sl.variant.product.name,
          warehouseId: sl.warehouse.id,
          warehouseName: sl.warehouse.name,
          quantityOnHand: sl.quantityOnHand,
          reorderThreshold: threshold,
        };
      })
      .filter((item) => item.quantityOnHand <= item.reorderThreshold);

    return { items };
  }

  async updateReorderThreshold(
    user: AuthenticatedUser,
    variantId: string,
    dto: UpdateReorderThresholdDto,
  ) {
    this.assertOwner(user);
    const variant = await this.prisma.productVariant.findFirst({
      where: { id: variantId, product: { tenantId: user.tenantId! } },
    });
    if (!variant) throw new NotFoundException('Variant not found');

    const updated = await this.prisma.productVariant.update({
      where: { id: variantId },
      data: { reorderThreshold: dto.reorderThreshold },
      select: { id: true, reorderThreshold: true, inventory: true },
    });
    return updated;
  }

  async listPurchaseOrders(tenantId: string, query: PurchaseOrderListQueryDto) {
    const { skip, take, page, limit } = this.paginate(query.page, query.limit);
    const where: Prisma.PurchaseOrderWhereInput = { tenantId };
    if (query.status) where.status = query.status;
    if (query.warehouseId) where.warehouseId = query.warehouseId;

    const [items, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          warehouse: { select: { id: true, name: true } },
          createdBy: { select: { id: true, email: true } },
        },
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);

    return {
      data: items.map((po) => this.mapPurchaseOrder(po)),
      meta: { total, page, limit },
    };
  }

  async getPurchaseOrder(tenantId: string, id: string) {
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id, tenantId },
      include: {
        warehouse: { select: { id: true, name: true } },
        createdBy: { select: { id: true, email: true } },
        lines: {
          include: {
            variant: {
              select: {
                id: true,
                sku: true,
                name: true,
                product: { select: { name: true } },
              },
            },
          },
        },
        receipts: {
          orderBy: { createdAt: 'desc' },
          include: {
            receivedBy: { select: { id: true, email: true } },
            lines: {
              include: {
                purchaseOrderLine: { select: { id: true, variantId: true } },
              },
            },
          },
        },
      },
    });
    if (!po) throw new NotFoundException('Purchase order not found');
    return this.mapPurchaseOrderDetail(po);
  }

  async createPurchaseOrder(user: AuthenticatedUser, dto: CreatePurchaseOrderDto) {
    const tenantId = user.tenantId!;
    await this.inventory.migrateTenantInventory(tenantId);
    await this.assertWarehouseActive(tenantId, dto.warehouseId);
    await this.validatePoLines(tenantId, dto.lines);

    const poNumber = await this.nextPoNumber(tenantId);
    const po = await this.prisma.purchaseOrder.create({
      data: {
        tenantId,
        warehouseId: dto.warehouseId,
        supplierName: dto.supplierName,
        status: dto.status === 'ORDERED' ? PurchaseOrderStatus.ORDERED : PurchaseOrderStatus.DRAFT,
        poNumber,
        createdById: user.userId,
        orderedAt: dto.status === 'ORDERED' ? new Date() : null,
        lines: {
          create: dto.lines.map((l) => ({
            variantId: l.variantId,
            quantityOrdered: l.quantityOrdered,
          })),
        },
      },
      include: {
        warehouse: { select: { id: true, name: true } },
        createdBy: { select: { id: true, email: true } },
        lines: {
          include: {
            variant: {
              select: {
                id: true,
                sku: true,
                name: true,
                product: { select: { name: true } },
              },
            },
          },
        },
        receipts: {
          orderBy: { createdAt: 'desc' },
          include: {
            receivedBy: { select: { id: true, email: true } },
            lines: {
              include: {
                purchaseOrderLine: { select: { id: true, variantId: true } },
              },
            },
          },
        },
      },
    });
    return this.mapPurchaseOrderDetail(po);
  }

  async updatePurchaseOrder(
    user: AuthenticatedUser,
    id: string,
    dto: UpdatePurchaseOrderDto,
  ) {
    const tenantId = user.tenantId!;
    const po = await this.getPurchaseOrderEntity(tenantId, id);
    if (po.status !== PurchaseOrderStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT purchase orders can be edited');
    }
    if (dto.warehouseId) await this.assertWarehouseActive(tenantId, dto.warehouseId);
    if (dto.lines) await this.validatePoLines(tenantId, dto.lines);

    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.lines) {
        await tx.purchaseOrderLine.deleteMany({ where: { purchaseOrderId: id } });
        await tx.purchaseOrderLine.createMany({
          data: dto.lines.map((l) => ({
            purchaseOrderId: id,
            variantId: l.variantId,
            quantityOrdered: l.quantityOrdered,
          })),
        });
      }
      return tx.purchaseOrder.update({
        where: { id },
        data: {
          supplierName: dto.supplierName,
          warehouseId: dto.warehouseId,
        },
        include: {
          warehouse: { select: { id: true, name: true } },
          createdBy: { select: { id: true, email: true } },
          lines: {
            include: {
              variant: {
                select: {
                  id: true,
                  sku: true,
                  name: true,
                  product: { select: { name: true } },
                },
              },
            },
          },
          receipts: {
            orderBy: { createdAt: 'desc' },
            include: {
              receivedBy: { select: { id: true, email: true } },
              lines: {
                include: {
                  purchaseOrderLine: { select: { id: true, variantId: true } },
                },
              },
            },
          },
        },
      });
    });
    return this.mapPurchaseOrderDetail(updated);
  }

  async submitPurchaseOrder(user: AuthenticatedUser, id: string) {
    const po = await this.getPurchaseOrderEntity(user.tenantId!, id);
    if (po.status !== PurchaseOrderStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT purchase orders can be submitted');
    }
    if (po.lines.length === 0) {
      throw new BadRequestException('Purchase order must have at least one line');
    }
    const updated = await this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: PurchaseOrderStatus.ORDERED, orderedAt: new Date() },
      include: {
        warehouse: { select: { id: true, name: true } },
        createdBy: { select: { id: true, email: true } },
        lines: {
          include: {
            variant: {
              select: {
                id: true,
                sku: true,
                name: true,
                product: { select: { name: true } },
              },
            },
          },
        },
        receipts: {
          orderBy: { createdAt: 'desc' },
          include: {
            receivedBy: { select: { id: true, email: true } },
            lines: {
              include: {
                purchaseOrderLine: { select: { id: true, variantId: true } },
              },
            },
          },
        },
      },
    });
    return this.mapPurchaseOrderDetail(updated);
  }

  async cancelPurchaseOrder(user: AuthenticatedUser, id: string) {
    const po = await this.getPurchaseOrderEntity(user.tenantId!, id);
    if (
      po.status !== PurchaseOrderStatus.DRAFT &&
      po.status !== PurchaseOrderStatus.ORDERED
    ) {
      throw new BadRequestException('Purchase order cannot be cancelled');
    }
    const received = po.lines.reduce((s, l) => s + l.quantityReceived, 0);
    if (received > 0) {
      throw new BadRequestException('Cannot cancel a purchase order with received quantity');
    }
    const updated = await this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: PurchaseOrderStatus.CANCELLED },
      include: {
        warehouse: { select: { id: true, name: true } },
        createdBy: { select: { id: true, email: true } },
        lines: {
          include: {
            variant: {
              select: {
                id: true,
                sku: true,
                name: true,
                product: { select: { name: true } },
              },
            },
          },
        },
        receipts: {
          orderBy: { createdAt: 'desc' },
          include: {
            receivedBy: { select: { id: true, email: true } },
            lines: {
              include: {
                purchaseOrderLine: { select: { id: true, variantId: true } },
              },
            },
          },
        },
      },
    });
    return this.mapPurchaseOrderDetail(updated);
  }

  async receivePurchaseOrder(
    user: AuthenticatedUser,
    id: string,
    dto: ReceivePurchaseOrderDto,
  ) {
    const tenantId = user.tenantId!;
    const po = await this.getPurchaseOrderEntity(tenantId, id);
    if (
      po.status !== PurchaseOrderStatus.ORDERED &&
      po.status !== PurchaseOrderStatus.PARTIALLY_RECEIVED
    ) {
      throw new BadRequestException('Purchase order is not open for receiving');
    }

    const lineMap = new Map(po.lines.map((l) => [l.id, l]));
    for (const line of dto.lines) {
      const poLine = lineMap.get(line.purchaseOrderLineId);
      if (!poLine) {
        throw new BadRequestException(`Invalid purchase order line: ${line.purchaseOrderLineId}`);
      }
      const remaining = poLine.quantityOrdered - poLine.quantityReceived;
      if (line.quantityReceived > remaining) {
        throw new BadRequestException(
          `Receive quantity exceeds remaining for line ${poLine.id}`,
        );
      }
    }

    await this.prisma.$transaction(async (tx) => {
      const receipt = await tx.purchaseOrderReceipt.create({
        data: {
          tenantId,
          purchaseOrderId: id,
          receivedById: user.userId,
          note: dto.note ?? null,
          lines: {
            create: dto.lines.map((l) => ({
              purchaseOrderLineId: l.purchaseOrderLineId,
              quantityReceived: l.quantityReceived,
            })),
          },
        },
        include: { lines: true },
      });

      for (const line of dto.lines) {
        const poLine = lineMap.get(line.purchaseOrderLineId)!;
        await tx.purchaseOrderLine.update({
          where: { id: poLine.id },
          data: { quantityReceived: poLine.quantityReceived + line.quantityReceived },
        });
        await this.inventory.incrementFromReceive(
          tenantId,
          po.warehouseId,
          poLine.variantId,
          line.quantityReceived,
          tx,
        );
      }

      const updatedLines = await tx.purchaseOrderLine.findMany({
        where: { purchaseOrderId: id },
      });
      const newStatus = this.inventory.derivePurchaseOrderStatus(updatedLines, po.status);
      await tx.purchaseOrder.update({
        where: { id },
        data: { status: newStatus },
      });

      return receipt;
    });

    await this.inventoryQueue.enqueueLowStockCheck({
      tenantId,
      warehouseId: po.warehouseId,
    });

    return this.getPurchaseOrder(tenantId, id);
  }

  async stockReport(tenantId: string) {
    return this.listStockLevels(tenantId, { page: 1, limit: 1000 });
  }

  async adjustmentsReport(tenantId: string, query: AdjustmentListQueryDto) {
    return this.listAdjustments(tenantId, { ...query, page: query.page ?? 1, limit: query.limit ?? 1000 });
  }

  stockReportCsv(tenantId: string) {
    return this.buildStockCsv(tenantId);
  }

  adjustmentsReportCsv(tenantId: string, query: AdjustmentListQueryDto) {
    return this.buildAdjustmentsCsv(tenantId, query);
  }

  private async buildStockCsv(tenantId: string) {
    const { data } = await this.listStockLevels(tenantId, { page: 1, limit: 10000 });
    const header = 'warehouse,sku,variant,product,quantity_on_hand,sellable_inventory';
    const rows = data.map(
      (sl) =>
        `"${sl.warehouse.name}","${sl.variant.sku}","${sl.variant.name}","${sl.variant.productName}",${sl.quantityOnHand},${sl.variant.sellableInventory}`,
    );
    return `${header}\n${rows.join('\n')}\n`;
  }

  private async buildAdjustmentsCsv(tenantId: string, query: AdjustmentListQueryDto) {
    const { data } = await this.listAdjustments(tenantId, {
      ...query,
      page: 1,
      limit: 10000,
    });
    const header = 'created_at,warehouse,sku,variant,reason,delta,before,after,actor';
    const rows = data.map(
      (a) =>
        `"${a.createdAt}","${a.warehouse.name}","${a.variant.sku}","${a.variant.name}","${a.reason}",${a.quantityDelta},${a.quantityBefore},${a.quantityAfter},"${a.actor.email}"`,
    );
    return `${header}\n${rows.join('\n')}\n`;
  }

  private async nextPoNumber(tenantId: string): Promise<string> {
    const count = await this.prisma.purchaseOrder.count({ where: { tenantId } });
    return `PO-${String(count + 1).padStart(5, '0')}`;
  }

  private async validatePoLines(
    tenantId: string,
    lines: Array<{ variantId: string; quantityOrdered: number }>,
  ) {
    if (lines.length === 0) {
      throw new BadRequestException('At least one line is required');
    }
    const variantIds = [...new Set(lines.map((l) => l.variantId))];
    if (variantIds.length !== lines.length) {
      throw new BadRequestException('Duplicate variants in purchase order lines');
    }
    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: variantIds }, product: { tenantId } },
      select: { id: true },
    });
    if (variants.length !== variantIds.length) {
      throw new BadRequestException('One or more variants are invalid for this tenant');
    }
  }

  private async assertWarehouseActive(tenantId: string, warehouseId: string) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: warehouseId, tenantId, isActive: true },
    });
    if (!warehouse) throw new NotFoundException('Warehouse not found');
    return warehouse;
  }

  private async getPurchaseOrderEntity(tenantId: string, id: string) {
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id, tenantId },
      include: { lines: true },
    });
    if (!po) throw new NotFoundException('Purchase order not found');
    return po;
  }

  private mapWarehouse(w: {
    id: string;
    tenantId: string;
    name: string;
    address: string | null;
    isDefault: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: w.id,
      tenantId: w.tenantId,
      name: w.name,
      address: w.address,
      isDefault: w.isDefault,
      isActive: w.isActive,
      createdAt: w.createdAt.toISOString(),
      updatedAt: w.updatedAt.toISOString(),
    };
  }

  private mapPurchaseOrder(po: {
    id: string;
    tenantId: string;
    warehouseId: string;
    supplierName: string;
    status: PurchaseOrderStatus;
    poNumber: string;
    createdById: string;
    orderedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    warehouse?: { id: string; name: string };
    createdBy?: { id: string; email: string };
  }) {
    return {
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
    };
  }

  private mapPurchaseOrderDetail(po: {
    id: string;
    tenantId: string;
    warehouseId: string;
    supplierName: string;
    status: PurchaseOrderStatus;
    poNumber: string;
    createdById: string;
    orderedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    warehouse: { id: string; name: string };
    createdBy: { id: string; email: string };
    lines: Array<{
      id: string;
      purchaseOrderId: string;
      variantId: string;
      quantityOrdered: number;
      quantityReceived: number;
      createdAt: Date;
      updatedAt: Date;
      variant: { id: string; sku: string; name: string; product: { name: string } };
    }>;
    receipts: Array<{
      id: string;
      tenantId: string;
      purchaseOrderId: string;
      receivedById: string;
      note: string | null;
      createdAt: Date;
      receivedBy: { id: string; email: string };
      lines: Array<{
        id: string;
        receiptId: string;
        purchaseOrderLineId: string;
        quantityReceived: number;
        purchaseOrderLine: { id: string; variantId: string };
      }>;
    }>;
  }) {
    return {
      ...this.mapPurchaseOrder(po),
      lines: (po.lines ?? []).map((l) => ({
        id: l.id,
        purchaseOrderId: l.purchaseOrderId,
        variantId: l.variantId,
        quantityOrdered: l.quantityOrdered,
        quantityReceived: l.quantityReceived,
        quantityRemaining: l.quantityOrdered - l.quantityReceived,
        createdAt: l.createdAt.toISOString(),
        updatedAt: l.updatedAt.toISOString(),
        variant: {
          id: l.variant.id,
          sku: l.variant.sku,
          name: l.variant.name,
          productName: l.variant.product.name,
        },
      })),
      receipts: (po.receipts ?? []).map((r) => ({
        id: r.id,
        tenantId: r.tenantId,
        purchaseOrderId: r.purchaseOrderId,
        receivedById: r.receivedById,
        note: r.note,
        createdAt: r.createdAt.toISOString(),
        receivedBy: r.receivedBy,
        lines: r.lines.map((rl) => ({
          id: rl.id,
          receiptId: rl.receiptId,
          purchaseOrderLineId: rl.purchaseOrderLineId,
          quantityReceived: rl.quantityReceived,
          purchaseOrderLine: rl.purchaseOrderLine,
        })),
      })),
    };
  }
}
