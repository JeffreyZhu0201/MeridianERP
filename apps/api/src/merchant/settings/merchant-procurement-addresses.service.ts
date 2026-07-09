import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateProcurementReceivingAddressDto,
  UpdateProcurementReceivingAddressDto,
} from './dto/procurement-address.dto';

@Injectable()
export class MerchantProcurementAddressesService {
  constructor(private readonly prisma: PrismaService) {}

  private assertOwner(user: AuthenticatedUser) {
    if (!user.roles.includes('MERCHANT_OWNER')) {
      throw new ForbiddenException('Merchant owner role required');
    }
  }

  private mapAddress(row: {
    id: string;
    tenantId: string;
    label: string;
    contactName: string;
    contactPhone: string;
    address: string;
    isDefault: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      tenantId: row.tenantId,
      label: row.label,
      contactName: row.contactName,
      contactPhone: row.contactPhone,
      address: row.address,
      isDefault: row.isDefault,
      isActive: row.isActive,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async list(tenantId: string, activeOnly = false) {
    const rows = await this.prisma.procurementReceivingAddress.findMany({
      where: {
        tenantId,
        ...(activeOnly ? { isActive: true } : {}),
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
    return rows.map((row) => this.mapAddress(row));
  }

  async resolveForOrder(tenantId: string, addressId?: string) {
    if (addressId) {
      const address = await this.prisma.procurementReceivingAddress.findFirst({
        where: { id: addressId, tenantId, isActive: true },
      });
      if (!address) {
        throw new NotFoundException('Receiving address not found');
      }
      return address;
    }

    const defaultAddress =
      await this.prisma.procurementReceivingAddress.findFirst({
        where: { tenantId, isActive: true, isDefault: true },
      });
    if (defaultAddress) return defaultAddress;

    const first = await this.prisma.procurementReceivingAddress.findFirst({
      where: { tenantId, isActive: true },
      orderBy: { createdAt: 'asc' },
    });
    if (!first) {
      throw new BadRequestException(
        'Add a procurement receiving address in Settings before ordering',
      );
    }
    return first;
  }

  snapshotFromAddress(address: {
    label: string;
    contactName: string;
    contactPhone: string;
    address: string;
  }) {
    return {
      label: address.label,
      contactName: address.contactName,
      contactPhone: address.contactPhone,
      address: address.address,
    };
  }

  async create(
    user: AuthenticatedUser,
    dto: CreateProcurementReceivingAddressDto,
  ) {
    this.assertOwner(user);
    const tenantId = user.tenantId!;
    const existingCount = await this.prisma.procurementReceivingAddress.count({
      where: { tenantId, isActive: true },
    });
    const isDefault = dto.isDefault ?? existingCount === 0;

    return this.prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.procurementReceivingAddress.updateMany({
          where: { tenantId },
          data: { isDefault: false },
        });
      }
      const created = await tx.procurementReceivingAddress.create({
        data: {
          tenantId,
          label: dto.label.trim(),
          contactName: dto.contactName.trim(),
          contactPhone: dto.contactPhone.trim(),
          address: dto.address.trim(),
          isDefault,
        },
      });
      return this.mapAddress(created);
    });
  }

  async update(
    user: AuthenticatedUser,
    id: string,
    dto: UpdateProcurementReceivingAddressDto,
  ) {
    this.assertOwner(user);
    const tenantId = user.tenantId!;
    const existing = await this.prisma.procurementReceivingAddress.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('Receiving address not found');

    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.procurementReceivingAddress.updateMany({
          where: { tenantId },
          data: { isDefault: false },
        });
      }

      const updated = await tx.procurementReceivingAddress.update({
        where: { id },
        data: {
          ...(dto.label !== undefined ? { label: dto.label.trim() } : {}),
          ...(dto.contactName !== undefined
            ? { contactName: dto.contactName.trim() }
            : {}),
          ...(dto.contactPhone !== undefined
            ? { contactPhone: dto.contactPhone.trim() }
            : {}),
          ...(dto.address !== undefined ? { address: dto.address.trim() } : {}),
          ...(dto.isDefault !== undefined ? { isDefault: dto.isDefault } : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        },
      });

      if (!updated.isActive && updated.isDefault) {
        const fallback = await tx.procurementReceivingAddress.findFirst({
          where: { tenantId, isActive: true, id: { not: id } },
          orderBy: { createdAt: 'asc' },
        });
        await tx.procurementReceivingAddress.update({
          where: { id },
          data: { isDefault: false },
        });
        if (fallback) {
          await tx.procurementReceivingAddress.update({
            where: { id: fallback.id },
            data: { isDefault: true },
          });
        }
        updated.isDefault = false;
      }

      return this.mapAddress(updated);
    });
  }

  async remove(user: AuthenticatedUser, id: string) {
    this.assertOwner(user);
    const tenantId = user.tenantId!;
    const existing = await this.prisma.procurementReceivingAddress.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('Receiving address not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.procurementReceivingAddress.delete({ where: { id } });
      if (existing.isDefault) {
        const fallback = await tx.procurementReceivingAddress.findFirst({
          where: { tenantId, isActive: true },
          orderBy: { createdAt: 'asc' },
        });
        if (fallback) {
          await tx.procurementReceivingAddress.update({
            where: { id: fallback.id },
            data: { isDefault: true },
          });
        }
      }
    });

    return { deleted: true };
  }

  async setDefault(user: AuthenticatedUser, id: string) {
    this.assertOwner(user);
    const tenantId = user.tenantId!;
    const existing = await this.prisma.procurementReceivingAddress.findFirst({
      where: { id, tenantId, isActive: true },
    });
    if (!existing) throw new NotFoundException('Receiving address not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.procurementReceivingAddress.updateMany({
        where: { tenantId },
        data: { isDefault: false },
      });
      await tx.procurementReceivingAddress.update({
        where: { id },
        data: { isDefault: true },
      });
    });

    return this.mapAddress({ ...existing, isDefault: true });
  }
}
