import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { CustomerDeliveryAddressRow } from '@meridian/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { PlatformAccountsService } from '../../platform/accounts/platform-accounts.service';
import {
  CreateCustomerDeliveryAddressDto,
  UpdateCustomerDeliveryAddressDto,
} from './dto/store-account.dto';

@Injectable()
export class StoreAccountAddressesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly platformAccounts: PlatformAccountsService,
  ) {}

  async resolveAccountId(userId: string): Promise<string> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: userId },
    });
    if (customer) {
      return customer.accountId;
    }

    const account = await this.platformAccounts.findById(userId);
    if (account) {
      return account.id;
    }

    throw new UnauthorizedException('Invalid store session');
  }

  private mapRow(row: {
    id: string;
    label: string | null;
    name: string;
    phone: string;
    line1: string;
    line2: string | null;
    city: string;
    province: string | null;
    postalCode: string | null;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): CustomerDeliveryAddressRow {
    return {
      id: row.id,
      label: row.label,
      name: row.name,
      phone: row.phone,
      line1: row.line1,
      line2: row.line2 ?? undefined,
      city: row.city,
      province: row.province ?? undefined,
      postalCode: row.postalCode ?? undefined,
      isDefault: row.isDefault,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async list(userId: string): Promise<CustomerDeliveryAddressRow[]> {
    const accountId = await this.resolveAccountId(userId);
    const rows = await this.prisma.customerDeliveryAddress.findMany({
      where: { accountId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
    return rows.map((row) => this.mapRow(row));
  }

  async create(userId: string, dto: CreateCustomerDeliveryAddressDto) {
    const accountId = await this.resolveAccountId(userId);
    const existingCount = await this.prisma.customerDeliveryAddress.count({
      where: { accountId },
    });
    const isDefault = dto.isDefault ?? existingCount === 0;

    return this.prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.customerDeliveryAddress.updateMany({
          where: { accountId },
          data: { isDefault: false },
        });
      }
      const created = await tx.customerDeliveryAddress.create({
        data: {
          accountId,
          label: dto.label ?? null,
          name: dto.name,
          phone: dto.phone,
          line1: dto.line1,
          line2: dto.line2 ?? null,
          city: dto.city,
          province: dto.province ?? null,
          postalCode: dto.postalCode ?? null,
          isDefault,
        },
      });
      return this.mapRow(created);
    });
  }

  async update(
    userId: string,
    addressId: string,
    dto: UpdateCustomerDeliveryAddressDto,
  ) {
    const accountId = await this.resolveAccountId(userId);
    const existing = await this.prisma.customerDeliveryAddress.findFirst({
      where: { id: addressId, accountId },
    });
    if (!existing) {
      throw new NotFoundException('Address not found');
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.customerDeliveryAddress.updateMany({
          where: { accountId },
          data: { isDefault: false },
        });
      }
      const updated = await tx.customerDeliveryAddress.update({
        where: { id: addressId },
        data: {
          ...(dto.label !== undefined ? { label: dto.label || null } : {}),
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
          ...(dto.line1 !== undefined ? { line1: dto.line1 } : {}),
          ...(dto.line2 !== undefined ? { line2: dto.line2 || null } : {}),
          ...(dto.city !== undefined ? { city: dto.city } : {}),
          ...(dto.province !== undefined
            ? { province: dto.province || null }
            : {}),
          ...(dto.postalCode !== undefined
            ? { postalCode: dto.postalCode || null }
            : {}),
          ...(dto.isDefault !== undefined ? { isDefault: dto.isDefault } : {}),
        },
      });
      return this.mapRow(updated);
    });
  }

  async remove(userId: string, addressId: string) {
    const accountId = await this.resolveAccountId(userId);
    const existing = await this.prisma.customerDeliveryAddress.findFirst({
      where: { id: addressId, accountId },
    });
    if (!existing) {
      throw new NotFoundException('Address not found');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.customerDeliveryAddress.delete({ where: { id: addressId } });
      if (existing.isDefault) {
        const next = await tx.customerDeliveryAddress.findFirst({
          where: { accountId },
          orderBy: { createdAt: 'asc' },
        });
        if (next) {
          await tx.customerDeliveryAddress.update({
            where: { id: next.id },
            data: { isDefault: true },
          });
        }
      }
    });

    return { ok: true };
  }
}
