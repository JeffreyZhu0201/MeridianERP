import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AllocationOrderStatus, Prisma } from '@prisma/client';
import { InventoryService } from '../../inventory/inventory.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PlatformAllocationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
  ) {}

  
  async listMasterSkus(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.masterSku.findMany({
        skip,
        take: limit,
        orderBy: { skuCode: 'asc' },
      }),
      this.prisma.masterSku.count(),
    ]);
    return { data, meta: { total, page, limit } };
  }

  
  async createMasterSku(dto: {
    skuCode: string;
    name: string;
    quantityOnHand?: number;
    unitCost: number;
    wholesalePrice: number;
    retailPrice: number;
  }) {
    return this.prisma.masterSku.create({
      data: {
        skuCode: dto.skuCode,
        name: dto.name,
        quantityOnHand: dto.quantityOnHand ?? 0,
        unitCost: dto.unitCost,
        wholesalePrice: dto.wholesalePrice,
        retailPrice: dto.retailPrice,
      },
    });
  }

  
  async updateMasterSku(
    id: string,
    dto: {
      name?: string;
      quantityOnHand?: number;
      unitCost?: number;
      wholesalePrice?: number;
      retailPrice?: number;
      isActive?: boolean;
    },
  ) {
    const sku = await this.prisma.masterSku.findUnique({ where: { id } });
    if (!sku) throw new NotFoundException('Master SKU not found');
    return this.prisma.masterSku.update({
      where: { id },
      data: dto,
    });
  }

  
  async listAllocations(tenantId?: string, status?: AllocationOrderStatus) {
    return this.prisma.allocationOrder.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        tenant: { include: { merchantProfile: true } },
        lines: { include: { masterSku: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  
  async listMerchantAllocations(tenantId: string, status?: AllocationOrderStatus) {
    return this.listAllocations(tenantId, status ?? AllocationOrderStatus.ISSUED);
  }

  
  async createAllocation(
    tenantId: string,
    lines: Array<{ masterSkuId: string; quantity: number }>,
    note?: string,
  ) {
    const masterSkus = await this.prisma.masterSku.findMany({
      where: { id: { in: lines.map((l) => l.masterSkuId) } },
    });
    const skuMap = new Map(masterSkus.map((s) => [s.id, s]));

    return this.prisma.allocationOrder.create({
      data: {
        tenantId,
        note,
        lines: {
          create: lines.map((l) => {
            const sku = skuMap.get(l.masterSkuId);
            if (!sku) throw new NotFoundException('Master SKU not found');
            if (!sku.isActive) {
              throw new BadRequestException(`Master SKU ${sku.skuCode} is inactive`);
            }
            return {
              masterSkuId: l.masterSkuId,
              quantity: l.quantity,
              wholesalePrice: sku.wholesalePrice,
            };
          }),
        },
      },
      include: { lines: true },
    });
  }

  
  async issueAllocation(id: string, platformUserId: string) {
    const order = await this.prisma.allocationOrder.findUnique({
      where: { id },
      include: { lines: { include: { masterSku: true } } },
    });
    if (!order) throw new NotFoundException('Allocation not found');
    if (order.status !== AllocationOrderStatus.DRAFT) {
      throw new BadRequestException('Only draft allocations can be issued');
    }
    for (const line of order.lines) {
      if (line.masterSku.quantityOnHand < line.quantity) {
        throw new BadRequestException(
          `Insufficient HQ stock for ${line.masterSku.skuCode}: need ${line.quantity}, have ${line.masterSku.quantityOnHand}`,
        );
      }
    }
    return this.prisma.$transaction(async (tx) => {
      for (const line of order.lines) {
        await tx.masterSku.update({
          where: { id: line.masterSkuId },
          data: {
            quantityOnHand: { decrement: line.quantity },
            cumulativeShippedQty: { increment: line.quantity },
          },
        });
      }
      return tx.allocationOrder.update({
        where: { id },
        data: {
          status: AllocationOrderStatus.ISSUED,
          issuedAt: new Date(),
          issuedByPlatformUserId: platformUserId,
        },
        include: { lines: { include: { masterSku: true } } },
      });
    });
  }

  
  async confirmAllocation(id: string, userId: string, tenantId: string) {
    const order = await this.prisma.allocationOrder.findFirst({
      where: { id, tenantId },
      include: { lines: { include: { masterSku: true } } },
    });
    if (!order) throw new NotFoundException('Allocation not found');
    if (order.status !== AllocationOrderStatus.ISSUED) {
      throw new BadRequestException('Allocation is not awaiting confirmation');
    }
    await this.inventoryService.migrateTenantInventory(tenantId);
    const defaultWarehouse = await this.prisma.warehouse.findFirst({
      where: { tenantId, isDefault: true },
    });
    if (!defaultWarehouse) {
      throw new BadRequestException('Default warehouse not configured');
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.allocationOrder.update({
        where: { id },
        data: {
          status: AllocationOrderStatus.CONFIRMED,
          confirmedAt: new Date(),
          confirmedByUserId: userId,
        },
      });
      for (const line of order.lines) {
        let variant = await tx.productVariant.findFirst({
          where: { masterSkuId: line.masterSkuId, product: { tenantId } },
        });
        if (!variant) {
          const product = await tx.product.create({
            data: {
              tenantId,
              name: line.masterSku.name,
              slug: `${line.masterSku.skuCode.toLowerCase()}-${Date.now()}`,
              isPublished: true,
            },
          });
          variant = await tx.productVariant.create({
            data: {
              productId: product.id,
              masterSkuId: line.masterSkuId,
              sku: line.masterSku.skuCode,
              name: line.masterSku.name,
              price: line.masterSku.retailPrice,
            },
          });
        }
        await this.inventoryService.applyQuantityDeltaInTx(
          tx,
          tenantId,
          defaultWarehouse.id,
          variant.id,
          line.quantity,
        );
        await this.inventoryService.syncVariantInventoryCache(variant.id, tx);
      }
    });

    return { id, status: AllocationOrderStatus.CONFIRMED };
  }
}
