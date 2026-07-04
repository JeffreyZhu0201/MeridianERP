import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { getPagination } from '../../common/pagination';
import { InventoryService } from '../../inventory/inventory.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AdjustmentListQueryDto,
  CreateStockAdjustmentDto,
  StockLevelListQueryDto,
  UpdateReorderThresholdDto,
} from './dto/inventory.dto';
import { MerchantWarehousesService } from './merchant-warehouses.service';

@Injectable()
export class MerchantStockService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
    private readonly warehouses: MerchantWarehousesService,
  ) {}

  private assertOwner(user: AuthenticatedUser) {
    if (!user.roles.includes('MERCHANT_OWNER')) {
      throw new ForbiddenException('Merchant owner role required');
    }
  }

  async listStockLevels(tenantId: string, query: StockLevelListQueryDto) {
    const { skip, take, page, limit } = getPagination(query);
    const defaultWarehouseId = await this.warehouses.resolveDefaultWarehouseId(tenantId);
    const where: Prisma.StockLevelWhereInput = {
      tenantId,
      warehouseId: defaultWarehouseId,
    };
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

    const byVariant = new Map<
      string,
      {
        variantId: string;
        sku: string;
        variantName: string;
        productId: string;
        productName: string;
        sellableInventory: number;
        totalOnHand: number;
        byWarehouse: Array<{
          warehouseId: string;
          warehouseName: string;
          quantityOnHand: number;
        }>;
      }
    >();

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
    const tenantId = user.tenantId!;
    return this.resolveAdjustmentWarehouseId(tenantId, dto.warehouseId).then(
      (warehouseId) =>
        this.inventory.adjustStock(
          tenantId,
          warehouseId,
          dto.variantId,
          dto.quantityDelta,
          dto.reason,
          dto.note,
          user.userId,
        ),
    );
  }

  private async resolveAdjustmentWarehouseId(
    tenantId: string,
    warehouseId?: string,
  ): Promise<string> {
    if (warehouseId) {
      const warehouse = await this.prisma.warehouse.findFirst({
        where: { id: warehouseId, tenantId },
      });
      if (!warehouse) throw new NotFoundException('Warehouse not found');
      return warehouse.id;
    }
    return this.warehouses.resolveDefaultWarehouseId(tenantId);
  }

  async listAdjustments(tenantId: string, query: AdjustmentListQueryDto) {
    const { skip, take, page, limit } = getPagination(query);
    const defaultWarehouseId = await this.warehouses.resolveDefaultWarehouseId(tenantId);
    const where: Prisma.StockAdjustmentWhereInput = {
      tenantId,
      warehouseId: defaultWarehouseId,
    };
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
}
