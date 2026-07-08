import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AllocationOrderStatus, Prisma } from '@prisma/client';
import type {
  CreateMasterSkuRequest,
  MasterSkuImageInput,
  UpdateMasterSkuRequest,
} from '@meridian/shared';
import { InventoryService } from '../../inventory/inventory.service';
import { CommissionService } from '../../commission/commission.service';
import { MediaService } from '../../media/media.service';
import { FlagshipCatalogService } from '../flagship-catalog/flagship-catalog.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  mapMasterSkuImages,
  masterSkuImageInclude,
  replaceMasterSkuImages,
  syncProductContentFromMasterSku,
} from '../catalog/product-content.util';

@Injectable()
export class PlatformAllocationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
    private readonly commissionService: CommissionService,
    private readonly flagshipCatalog: FlagshipCatalogService,
    private readonly mediaService: MediaService,
  ) {}

  private mapMasterSku(
    sku: Prisma.MasterSkuGetPayload<{ include: typeof masterSkuImageInclude }>,
  ) {
    return {
      ...sku,
      unitCost: sku.unitCost.toString(),
      wholesalePrice: sku.wholesalePrice.toString(),
      retailPrice: sku.retailPrice.toString(),
      flagshipPrice: sku.flagshipPrice.toString(),
      images: mapMasterSkuImages(sku),
    };
  }

  async listMasterSkus(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.masterSku.findMany({
        skip,
        take: limit,
        orderBy: { skuCode: 'asc' },
        include: masterSkuImageInclude,
      }),
      this.prisma.masterSku.count(),
    ]);
    return {
      data: data.map((sku) => this.mapMasterSku(sku)),
      meta: { total, page, limit },
    };
  }

  async getMasterSku(id: string) {
    const sku = await this.prisma.masterSku.findUnique({
      where: { id },
      include: masterSkuImageInclude,
    });
    if (!sku) throw new NotFoundException('Master SKU not found');
    return this.mapMasterSku(sku);
  }

  private async validateImageInputs(images?: MasterSkuImageInput[]) {
    if (!images?.length) return;
    const ids = images.map((image) => image.mediaAssetId);
    const assets = await this.prisma.mediaAsset.findMany({
      where: { id: { in: ids } },
    });
    if (assets.length !== ids.length) {
      throw new BadRequestException('One or more media assets not found');
    }
  }

  async createMasterSku(dto: CreateMasterSkuRequest) {
    await this.validateImageInputs(dto.images);
    let removedAssetIds: string[] = [];
    const sku = await this.prisma.$transaction(async (tx) => {
      const created = await tx.masterSku.create({
        data: {
          skuCode: dto.skuCode,
          name: dto.name,
          description: dto.description ?? null,
          shortDescription: dto.shortDescription ?? null,
          quantityOnHand: dto.quantityOnHand ?? 0,
          unitCost: dto.unitCost,
          wholesalePrice: dto.wholesalePrice,
          retailPrice: dto.retailPrice,
          flagshipPrice: dto.flagshipPrice,
        },
        include: masterSkuImageInclude,
      });
      removedAssetIds = await replaceMasterSkuImages(tx, created.id, dto.images);
      return tx.masterSku.findUniqueOrThrow({
        where: { id: created.id },
        include: masterSkuImageInclude,
      });
    });
    await this.mediaService.cleanupUnreferencedMediaAssets(removedAssetIds);
    await this.flagshipCatalog.syncMasterSkuToFlagship(sku.id);
    return this.mapMasterSku(sku);
  }

  async updateMasterSku(id: string, dto: UpdateMasterSkuRequest) {
    const existing = await this.prisma.masterSku.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Master SKU not found');
    await this.validateImageInputs(dto.images);

    const { images, ...fields } = dto;
    let removedAssetIds: string[] = [];
    const sku = await this.prisma.$transaction(async (tx) => {
      await tx.masterSku.update({
        where: { id },
        data: fields,
      });
      removedAssetIds = await replaceMasterSkuImages(tx, id, images);
      return tx.masterSku.findUniqueOrThrow({
        where: { id },
        include: masterSkuImageInclude,
      });
    });
    await this.mediaService.cleanupUnreferencedMediaAssets(removedAssetIds);
    await this.flagshipCatalog.syncMasterSkuToFlagship(id);
    return this.mapMasterSku(sku);
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

  async listMerchantAllocations(
    tenantId: string,
    status?: AllocationOrderStatus,
  ) {
    return this.listAllocations(
      tenantId,
      status ?? AllocationOrderStatus.ISSUED,
    );
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
            if (!sku) {
              throw new NotFoundException(`Master SKU ${l.masterSkuId} not found`);
            }
            return {
              masterSkuId: l.masterSkuId,
              quantity: l.quantity,
              wholesalePrice: sku.wholesalePrice,
            };
          }),
        },
      },
      include: { lines: { include: { masterSku: true } } },
    });
  }

  async issueAllocation(id: string, platformUserId: string) {
    const order = await this.prisma.allocationOrder.findUnique({
      where: { id },
      include: { lines: true },
    });
    if (!order) throw new NotFoundException('Allocation not found');
    if (order.status !== AllocationOrderStatus.DRAFT) {
      throw new BadRequestException('Only draft allocations can be issued');
    }

    return this.prisma.$transaction(async (tx) => {
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
      include: {
        lines: {
          include: {
            masterSku: {
              include: masterSkuImageInclude,
            },
          },
        },
      },
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
          include: { product: true },
        });
        if (!variant) {
          const product = await tx.product.create({
            data: {
              tenantId,
              name: line.masterSku.name,
              slug: `${line.masterSku.skuCode.toLowerCase()}-${Date.now()}`,
              description: line.masterSku.description,
              shortDescription: line.masterSku.shortDescription,
              isPublished: true,
            },
          });
          await syncProductContentFromMasterSku(tx, product.id, line.masterSku);
          variant = await tx.productVariant.create({
            data: {
              productId: product.id,
              masterSkuId: line.masterSkuId,
              sku: line.masterSku.skuCode,
              name: line.masterSku.name,
              price: line.masterSku.retailPrice,
            },
            include: { product: true },
          });
        } else {
          await syncProductContentFromMasterSku(
            tx,
            variant.productId,
            line.masterSku,
          );
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

    await this.commissionService.accrueOnAllocationConfirmed(id);

    return { id, status: AllocationOrderStatus.CONFIRMED };
  }
}
