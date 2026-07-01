import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AllocationOrderStatus, Prisma } from '@prisma/client';
import { InventoryService } from '../../inventory/inventory.service';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * 平台配额服务 - 处理总部主 SKU 管理和配额分配
 *
 * 核心概念：
 * - Master SKU：总部主 SKU，包含批发价、零售价、库存
 * - AllocationOrder：配额订单，总部向商户分配商品
 * - 流程：创建配额 → 发放(ISSUED) → 商户确认(CONFIRMED)
 */
@Injectable()
export class PlatformAllocationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
  ) {}

  /**
   * 分页查询主 SKU 列表
   *
   * @param page - 页码
   * @param limit - 每页数量
   * @returns 分页结果
   */
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

  /**
   * 创建主 SKU
   *
   * @param dto - SKU 信息
   * @returns 创建的 SKU
   */
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

  /**
   * 更新主 SKU
   *
   * @param id - SKU ID
   * @param dto - 更新字段
   * @returns 更新后的 SKU
   */
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

  /**
   * 查询配额订单列表
   *
   * @param tenantId - 可选，按租户筛选
   * @param status - 可选，按状态筛选
   * @returns 配额订单列表
   */
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

  /**
   * 商户查询自己的配额订单
   * 默认筛选已发放状态
   *
   * @param tenantId - 商户租户 ID
   * @param status - 可选，默认 ISSUED
   * @returns 配额订单列表
   */
  async listMerchantAllocations(tenantId: string, status?: AllocationOrderStatus) {
    return this.listAllocations(tenantId, status ?? AllocationOrderStatus.ISSUED);
  }

  /**
   * 创建配额订单（草稿状态）
   *
   * @param tenantId - 目标商户租户 ID
   * @param lines - 配额明细 [{masterSkuId, quantity}]
   * @param note - 可选备注
   * @returns 创建的配额订单
   */
  async createAllocation(
    tenantId: string,
    lines: Array<{ masterSkuId: string; quantity: number }>,
    note?: string,
  ) {
    // 查询所有涉及的 SKU
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

  /**
   * 发放配额（总部操作）
   *
   * 流程：
   * 1. 验证配额订单存在且为 DRAFT 状态
   * 2. 验证每个 SKU 库存充足
   * 3. 事务中扣减 Master SKU 库存
   * 4. 更新状态为 ISSUED
   *
   * @param id - 配额订单 ID
   * @param platformUserId - 平台操作人 ID
   * @returns 更新后的配额订单
   */
  async issueAllocation(id: string, platformUserId: string) {
    const order = await this.prisma.allocationOrder.findUnique({
      where: { id },
      include: { lines: { include: { masterSku: true } } },
    });
    if (!order) throw new NotFoundException('Allocation not found');
    if (order.status !== AllocationOrderStatus.DRAFT) {
      throw new BadRequestException('Only draft allocations can be issued');
    }

    // 验证库存
    for (const line of order.lines) {
      if (line.masterSku.quantityOnHand < line.quantity) {
        throw new BadRequestException(
          `Insufficient HQ stock for ${line.masterSku.skuCode}: need ${line.quantity}, have ${line.masterSku.quantityOnHand}`,
        );
      }
    }

    // 事务：扣减库存 + 更新状态
    return this.prisma.$transaction(async (tx) => {
      // 扣减每个 SKU 的库存
      for (const line of order.lines) {
        await tx.masterSku.update({
          where: { id: line.masterSkuId },
          data: {
            quantityOnHand: { decrement: line.quantity },
            cumulativeShippedQty: { increment: line.quantity },
          },
        });
      }

      // 更新状态为已发放
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

  /**
   * 商户确认配额
   *
   * 流程：
   * 1. 验证配额订单存在且为 ISSUED 状态
   * 2. 确保商户有默认仓库和库存设置
   * 3. 事务中：
   *    - 更新配额状态为 CONFIRMED
   *    - 为每个 SKU 创建或找到 ProductVariant
   *    - 增加商户仓库的库存
   *    - 同步可售缓存
   *
   * @param id - 配额订单 ID
   * @param userId - 商户用户 ID
   * @param tenantId - 商户租户 ID
   * @returns 确认结果
   */
  async confirmAllocation(id: string, userId: string, tenantId: string) {
    const order = await this.prisma.allocationOrder.findFirst({
      where: { id, tenantId },
      include: { lines: { include: { masterSku: true } } },
    });
    if (!order) throw new NotFoundException('Allocation not found');
    if (order.status !== AllocationOrderStatus.ISSUED) {
      throw new BadRequestException('Allocation is not awaiting confirmation');
    }

    // 确保商户有仓库设置
    await this.inventoryService.migrateTenantInventory(tenantId);
    const defaultWarehouse = await this.prisma.warehouse.findFirst({
      where: { tenantId, isDefault: true },
    });
    if (!defaultWarehouse) {
      throw new BadRequestException('Default warehouse not configured');
    }

    // 事务：更新状态 + 创建/找到变体 + 增加库存
    await this.prisma.$transaction(async (tx) => {
      // 更新配额状态
      await tx.allocationOrder.update({
        where: { id },
        data: {
          status: AllocationOrderStatus.CONFIRMED,
          confirmedAt: new Date(),
          confirmedByUserId: userId,
        },
      });

      // 处理每个配额行
      for (const line of order.lines) {
        // 查找是否已存在关联的变体
        let variant = await tx.productVariant.findFirst({
          where: { masterSkuId: line.masterSkuId, product: { tenantId } },
        });
        // 如果不存在，创建产品和变体
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
        // 增加商户库存
        await this.inventoryService.applyQuantityDeltaInTx(
          tx,
          tenantId,
          defaultWarehouse.id,
          variant.id,
          line.quantity,
        );
        // 同步缓存
        await this.inventoryService.syncVariantInventoryCache(variant.id, tx);
      }
    });

    return { id, status: AllocationOrderStatus.CONFIRMED };
  }
}
