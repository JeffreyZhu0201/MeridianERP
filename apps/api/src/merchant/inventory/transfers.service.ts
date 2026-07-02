import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, StockTransferStatus } from '@prisma/client';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { getPagination } from '../../common/pagination';
import { InventoryService } from '../../inventory/inventory.service';
import { InventoryQueueService } from '../../queue/inventory-queue.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateStockTransferDto,
  StockTransferListQueryDto,
} from './dto/inventory.dto';

/**
 * 库存调拨服务 (MerchantTransfersService)
 *
 * 负责商户仓库间的库存调拨操作。
 *
 * 功能：
 * 1. 创建调拨单（同时完成调拨，状态直接为 COMPLETED）
 * 2. 调拨单列表查询（支持源/目标仓库筛选）
 * 3. 调拨单详情查询
 *
 * 业务逻辑：
 * - 调拨时自动更新源仓库和目标仓库的库存水平
 * - 调拨完成后自动触发低库存检查
 * - 源仓库和目标仓库不能相同
 *
 * 调拨单状态：目前仅支持 COMPLETED（已完成）
 */
@Injectable()
export class MerchantTransfersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
    private readonly inventoryQueue: InventoryQueueService,
  ) {}

  async createTransfer(user: AuthenticatedUser, dto: CreateStockTransferDto) {
    const tenantId = user.tenantId!;

    if (dto.fromWarehouseId === dto.toWarehouseId) {
      throw new BadRequestException(
        'Source and destination warehouses must differ',
      );
    }

    await this.inventory.migrateTenantInventory(tenantId);
    await this.validateTransferLines(tenantId, dto.lines);

    const transfer = await this.prisma.$transaction(async (tx) => {
      const created = await tx.stockTransfer.create({
        data: {
          tenantId,
          fromWarehouseId: dto.fromWarehouseId,
          toWarehouseId: dto.toWarehouseId,
          status: StockTransferStatus.COMPLETED,
          note: dto.note ?? null,
          createdById: user.userId,
          lines: {
            create: dto.lines.map((line) => ({
              variantId: line.variantId,
              quantity: line.quantity,
            })),
          },
        },
        include: this.transferInclude(),
      });

      for (const line of dto.lines) {
        await this.inventory.applyTransferLineInTx(tx, {
          tenantId,
          fromWarehouseId: dto.fromWarehouseId,
          toWarehouseId: dto.toWarehouseId,
          variantId: line.variantId,
          quantity: line.quantity,
          actorId: user.userId,
          note: dto.note,
        });
      }

      return created;
    });

    await this.inventoryQueue.enqueueLowStockCheck({
      tenantId,
      warehouseId: dto.fromWarehouseId,
    });
    await this.inventoryQueue.enqueueLowStockCheck({
      tenantId,
      warehouseId: dto.toWarehouseId,
    });

    return this.mapTransfer(transfer);
  }

  async listTransfers(tenantId: string, query: StockTransferListQueryDto) {
    const { skip, take, page, limit } = getPagination(query);
    const where: Prisma.StockTransferWhereInput = { tenantId };
    if (query.fromWarehouseId) where.fromWarehouseId = query.fromWarehouseId;
    if (query.toWarehouseId) where.toWarehouseId = query.toWarehouseId;

    const [items, total] = await Promise.all([
      this.prisma.stockTransfer.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: this.transferInclude(),
      }),
      this.prisma.stockTransfer.count({ where }),
    ]);

    return {
      data: items.map((t) => this.mapTransfer(t)),
      meta: { total, page, limit },
    };
  }

  async getTransfer(tenantId: string, id: string) {
    const transfer = await this.prisma.stockTransfer.findFirst({
      where: { id, tenantId },
      include: this.transferInclude(),
    });
    if (!transfer) throw new NotFoundException('Stock transfer not found');
    return this.mapTransfer(transfer);
  }

  private transferInclude() {
    return {
      fromWarehouse: { select: { id: true, name: true } },
      toWarehouse: { select: { id: true, name: true } },
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
    } satisfies Prisma.StockTransferInclude;
  }

  private async validateTransferLines(
    tenantId: string,
    lines: Array<{ variantId: string; quantity: number }>,
  ) {
    if (lines.length === 0) {
      throw new BadRequestException('At least one line is required');
    }
    const variantIds = [...new Set(lines.map((l) => l.variantId))];
    if (variantIds.length !== lines.length) {
      throw new BadRequestException('Duplicate variants in transfer lines');
    }
    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: variantIds }, product: { tenantId } },
      select: { id: true },
    });
    if (variants.length !== variantIds.length) {
      throw new BadRequestException(
        'One or more variants are invalid for this tenant',
      );
    }
  }

  private mapTransfer(transfer: {
    id: string;
    tenantId: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    status: StockTransferStatus;
    note: string | null;
    createdById: string;
    createdAt: Date;
    fromWarehouse: { id: string; name: string };
    toWarehouse: { id: string; name: string };
    createdBy: { id: string; email: string };
    lines: Array<{
      id: string;
      transferId: string;
      variantId: string;
      quantity: number;
      variant: {
        id: string;
        sku: string;
        name: string;
        product: { name: string };
      };
    }>;
  }) {
    return {
      id: transfer.id,
      tenantId: transfer.tenantId,
      fromWarehouseId: transfer.fromWarehouseId,
      toWarehouseId: transfer.toWarehouseId,
      status: transfer.status,
      note: transfer.note,
      createdById: transfer.createdById,
      createdAt: transfer.createdAt.toISOString(),
      fromWarehouse: transfer.fromWarehouse,
      toWarehouse: transfer.toWarehouse,
      createdBy: transfer.createdBy,
      lines: transfer.lines.map((line) => ({
        id: line.id,
        transferId: line.transferId,
        variantId: line.variantId,
        quantity: line.quantity,
        variant: {
          id: line.variant.id,
          sku: line.variant.sku,
          name: line.variant.name,
          productName: line.variant.product.name,
        },
      })),
    };
  }
}
