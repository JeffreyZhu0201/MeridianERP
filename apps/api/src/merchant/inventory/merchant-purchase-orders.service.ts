import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PurchaseOrderStatus } from '@prisma/client';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { getPagination } from '../../common/pagination';
import { InventoryService } from '../../inventory/inventory.service';
import { InventoryQueueService } from '../../queue/inventory-queue.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreatePurchaseOrderDto,
  PurchaseOrderListQueryDto,
  ReceivePurchaseOrderDto,
  UpdatePurchaseOrderDto,
} from './dto/inventory.dto';

@Injectable()
export class MerchantPurchaseOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
    private readonly inventoryQueue: InventoryQueueService,
  ) {}

  async listPurchaseOrders(tenantId: string, query: PurchaseOrderListQueryDto) {
    const { skip, take, page, limit } = getPagination(query);
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
      include: this.purchaseOrderDetailInclude(),
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
        status:
          dto.status === 'ORDERED'
            ? PurchaseOrderStatus.ORDERED
            : PurchaseOrderStatus.DRAFT,
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
      include: this.purchaseOrderDetailInclude(),
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
        include: this.purchaseOrderDetailInclude(),
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
      include: this.purchaseOrderDetailInclude(),
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
      include: this.purchaseOrderDetailInclude(),
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
        throw new BadRequestException(
          `Invalid purchase order line: ${line.purchaseOrderLineId}`,
        );
      }
      const remaining = poLine.quantityOrdered - poLine.quantityReceived;
      if (line.quantityReceived > remaining) {
        throw new BadRequestException(
          `Receive quantity exceeds remaining for line ${poLine.id}`,
        );
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.purchaseOrderReceipt.create({
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
      });

      for (const line of dto.lines) {
        const poLine = lineMap.get(line.purchaseOrderLineId)!;
        await tx.purchaseOrderLine.update({
          where: { id: poLine.id },
          data: {
            quantityReceived: poLine.quantityReceived + line.quantityReceived,
          },
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
      const newStatus = this.inventory.derivePurchaseOrderStatus(
        updatedLines,
        po.status,
      );
      await tx.purchaseOrder.update({
        where: { id },
        data: { status: newStatus },
      });
    });

    await this.inventoryQueue.enqueueLowStockCheck({
      tenantId,
      warehouseId: po.warehouseId,
    });

    return this.getPurchaseOrder(tenantId, id);
  }

  private purchaseOrderDetailInclude() {
    return {
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
        orderBy: { createdAt: 'desc' as const },
        include: {
          receivedBy: { select: { id: true, email: true } },
          lines: {
            include: {
              purchaseOrderLine: { select: { id: true, variantId: true } },
            },
          },
        },
      },
    };
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
      variant: {
        id: string;
        sku: string;
        name: string;
        product: { name: string };
      };
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
