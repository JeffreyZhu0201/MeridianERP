import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { InventoryService } from '../../inventory/inventory.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateInventorySettingsDto } from './dto/inventory.dto';

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

  async resolveDefaultWarehouseId(tenantId: string): Promise<string> {
    await this.inventory.migrateTenantInventory(tenantId);
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { tenantId, isDefault: true },
    });
    if (!warehouse) {
      throw new NotFoundException('Default warehouse not found');
    }
    return warehouse.id;
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
}
