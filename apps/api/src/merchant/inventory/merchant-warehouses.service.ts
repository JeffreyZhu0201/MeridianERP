import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { InventoryService } from '../../inventory/inventory.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateWarehouseDto,
  UpdateInventorySettingsDto,
  UpdateWarehouseDto,
} from './dto/inventory.dto';

@Injectable()
export class MerchantWarehousesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
  ) {}

  private assertOwner(user: AuthenticatedUser) {
    if (!user.roles.includes('MERCHANT_OWNER')) {
      throw new ForbiddenException('Merchant owner role required');
    }
  }

  async getSettings(tenantId: string) {
    await this.inventory.migrateTenantInventory(tenantId);
    const settings =
      await this.prisma.tenantInventorySettings.findUniqueOrThrow({
        where: { tenantId },
      });
    return {
      tenantId: settings.tenantId,
      defaultReorderThreshold: settings.defaultReorderThreshold,
      createdAt: settings.createdAt.toISOString(),
      updatedAt: settings.updatedAt.toISOString(),
    };
  }

  async updateSettings(
    user: AuthenticatedUser,
    dto: UpdateInventorySettingsDto,
  ) {
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
    return this.prisma
      .$transaction(async (tx) => {
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
        if (
          !(await tx.warehouse.findFirst({
            where: { tenantId, isDefault: true },
          }))
        ) {
          return tx.warehouse.update({
            where: { id: warehouse.id },
            data: { isDefault: true },
          });
        }
        return warehouse;
      })
      .then((w) => this.mapWarehouse(w));
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
}
