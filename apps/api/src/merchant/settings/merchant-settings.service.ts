import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MerchantRole, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { EnvService } from '../../config/env.service';
import { PaymentService } from '../../payment/payment.service';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryService } from '../../inventory/inventory.service';
import { PlatformAccountsService } from '../../platform/accounts/platform-accounts.service';
import { UpdateMerchantSettingsDto } from './dto/update-merchant-settings.dto';
import {
  CreateTeamMemberDto,
  UpdateTeamMemberDto,
} from './dto/team-member.dto';

@Injectable()
export class MerchantSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly env: EnvService,
    private readonly payment: PaymentService,
    private readonly platformAccounts: PlatformAccountsService,
    private readonly inventory: InventoryService,
  ) {}

  private assertOwner(user: AuthenticatedUser) {
    if (!user.roles.includes('MERCHANT_OWNER')) {
      throw new ForbiddenException('Merchant owner role required');
    }
  }

  private storeAppUrl(): string {
    return (
      this.env.get('STORE_APP_URL', 'http://localhost:3003') ??
      'http://localhost:3003'
    );
  }

  private stripeMode(): 'mock' | 'live' {
    return this.payment.isMockMode() ? 'mock' : 'live';
  }

  private mapSettings(
    tenantId: string,
    row: {
      defaultCommissionRate: Prisma.Decimal | null;
      defaultCommissionType: string | null;
      notifyOnCommission: boolean;
      updatedAt: Date;
    },
  ) {
    return {
      tenantId,
      defaultCommissionRate: row.defaultCommissionRate?.toString() ?? null,
      defaultCommissionType: row.defaultCommissionType,
      notifyOnCommission: row.notifyOnCommission,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private async ensureTenantSettings(tenantId: string) {
    return this.prisma.tenantSettings.upsert({
      where: { tenantId },
      create: { tenantId },
      update: {},
    });
  }

  async getSettings(tenantId: string) {
    await this.inventory.migrateTenantInventory(tenantId);

    const [profile, tenant, settings, defaultWarehouse] = await Promise.all([
      this.prisma.merchantProfile.findUniqueOrThrow({
        where: { tenantId },
      }),
      this.prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } }),
      this.ensureTenantSettings(tenantId),
      this.prisma.warehouse.findFirst({
        where: { tenantId, isDefault: true },
      }),
    ]);

    const storeUrl = `${this.storeAppUrl()}/s/${tenant.slug}`;

    return {
      ...this.mapSettings(tenantId, settings),
      profile: {
        businessName: profile.businessName,
        legalName: profile.legalName,
        contactEmail: profile.contactEmail,
        contactPhone: profile.contactPhone,
        storeAddress: defaultWarehouse?.address ?? null,
        isFlagship: profile.isFlagship,
      },
      storeUrl,
      stripeMode: this.stripeMode(),
    };
  }

  async updateSettings(
    user: AuthenticatedUser,
    dto: UpdateMerchantSettingsDto,
  ) {
    this.assertOwner(user);
    const tenantId = user.tenantId!;

    await this.inventory.migrateTenantInventory(tenantId);

    const profileData: Prisma.MerchantProfileUpdateInput = {};
    if (dto.businessName !== undefined)
      profileData.businessName = dto.businessName;
    if (dto.contactEmail !== undefined)
      profileData.contactEmail = dto.contactEmail;
    if (dto.contactPhone !== undefined)
      profileData.contactPhone = dto.contactPhone;
    if (dto.legalName !== undefined) profileData.legalName = dto.legalName;

    const settingsData: Prisma.TenantSettingsUpdateInput = {};
    if (dto.defaultCommissionRate !== undefined) {
      settingsData.defaultCommissionRate =
        dto.defaultCommissionRate === null
          ? null
          : new Prisma.Decimal(dto.defaultCommissionRate);
    }
    if (dto.defaultCommissionType !== undefined) {
      settingsData.defaultCommissionType = dto.defaultCommissionType;
    }
    if (dto.notifyOnCommission !== undefined) {
      settingsData.notifyOnCommission = dto.notifyOnCommission;
    }

    await this.prisma.$transaction(async (tx) => {
      if (Object.keys(profileData).length > 0) {
        await tx.merchantProfile.update({
          where: { tenantId },
          data: profileData,
        });
      }
      if (dto.storeAddress !== undefined) {
        const defaultWarehouse = await tx.warehouse.findFirst({
          where: { tenantId, isDefault: true },
        });
        if (defaultWarehouse) {
          await tx.warehouse.update({
            where: { id: defaultWarehouse.id },
            data: { address: dto.storeAddress },
          });
        }
      }
      if (Object.keys(settingsData).length > 0) {
        const existing = await tx.tenantSettings.findUnique({
          where: { tenantId },
        });
        if (existing) {
          await tx.tenantSettings.update({
            where: { tenantId },
            data: settingsData,
          });
        } else {
          await tx.tenantSettings.create({
            data: {
              tenantId,
              ...(dto.defaultCommissionRate !== undefined && {
                defaultCommissionRate:
                  dto.defaultCommissionRate === null
                    ? null
                    : new Prisma.Decimal(dto.defaultCommissionRate),
              }),
              ...(dto.defaultCommissionType !== undefined && {
                defaultCommissionType: dto.defaultCommissionType,
              }),
              ...(dto.notifyOnCommission !== undefined && {
                notifyOnCommission: dto.notifyOnCommission,
              }),
            },
          });
        }
      }
    });

    return this.getSettings(tenantId);
  }

  async listTeam(tenantId: string) {
    const users = await this.prisma.user.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    }));
  }

  async createTeamMember(user: AuthenticatedUser, dto: CreateTeamMemberDto) {
    this.assertOwner(user);
    const tenantId = user.tenantId!;

    const existing = await this.prisma.user.findFirst({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    let account = await this.platformAccounts.findByEmail(dto.email);
    if (account) {
      const valid = await this.platformAccounts.verifyPassword(
        account,
        dto.password,
      );
      if (!valid) {
        throw new ConflictException('Email already registered');
      }
    } else {
      account = await this.platformAccounts.createAccount({
        email: dto.email,
        password: dto.password,
      });
    }

    const created = await this.prisma.user.create({
      data: {
        tenantId,
        accountId: account.id,
        email: dto.email,
        role: MerchantRole.MERCHANT_STAFF,
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return {
      id: created.id,
      email: created.email,
      role: created.role,
      createdAt: created.createdAt.toISOString(),
    };
  }

  async updateTeamMember(
    user: AuthenticatedUser,
    memberId: string,
    dto: UpdateTeamMemberDto,
  ) {
    this.assertOwner(user);
    const tenantId = user.tenantId!;

    const member = await this.prisma.user.findFirst({
      where: { id: memberId, tenantId },
      include: { account: true },
    });
    if (!member) {
      throw new NotFoundException('Team member not found');
    }
    if (member.role === MerchantRole.MERCHANT_OWNER) {
      throw new ForbiddenException('Cannot modify owner account');
    }

    await this.prisma.platformAccount.update({
      where: { id: member.accountId },
      data: { password: await bcrypt.hash(dto.password, 10) },
    });
    const updated = await this.prisma.user.findUniqueOrThrow({
      where: { id: memberId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return {
      id: updated.id,
      email: updated.email,
      role: updated.role,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  async removeTeamMember(user: AuthenticatedUser, memberId: string) {
    this.assertOwner(user);
    const tenantId = user.tenantId!;

    if (memberId === user.userId) {
      throw new ForbiddenException('Cannot remove your own account');
    }

    const member = await this.prisma.user.findFirst({
      where: { id: memberId, tenantId },
    });
    if (!member) {
      throw new NotFoundException('Team member not found');
    }
    if (member.role === MerchantRole.MERCHANT_OWNER) {
      throw new ForbiddenException('Cannot remove owner account');
    }

    await this.prisma.user.delete({ where: { id: memberId } });
    return { deleted: true };
  }
}
