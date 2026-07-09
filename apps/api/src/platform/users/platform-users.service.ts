import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CommissionType,
  MerchantRole,
  PlatformAccount,
  PlatformRole,
  Prisma,
} from '@prisma/client';
import type {
  PlatformAccountDetail,
  PlatformAccountListItem,
} from '@meridian/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { PlatformAccountsService } from '../accounts/platform-accounts.service';
import { ListPlatformUsersQueryDto } from './dto/list-platform-users-query.dto';
import { UpdatePlatformAccountDto } from './dto/update-platform-account.dto';
import { UpdatePlatformAccountIdentitiesDto } from './dto/update-platform-account-identities.dto';

@Injectable()
export class PlatformUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly platformAccounts: PlatformAccountsService,
  ) {}

  async list(query: ListPlatformUsersQueryDto = {}) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.PlatformAccountWhereInput = {};
    if (query.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { email: { contains: term, mode: 'insensitive' } },
        { firstName: { contains: term, mode: 'insensitive' } },
        { lastName: { contains: term, mode: 'insensitive' } },
      ];
    }
    if (query.identity === 'CONSUMER') {
      where.customers = { some: {} };
    } else if (query.identity === 'MERCHANT_OWNER') {
      where.merchantUsers = { some: { role: MerchantRole.MERCHANT_OWNER } };
    } else if (query.identity === 'MERCHANT_STAFF') {
      where.merchantUsers = { some: { role: MerchantRole.MERCHANT_STAFF } };
    }

    const [accounts, total] = await Promise.all([
      this.prisma.platformAccount.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          merchantUsers: {
            include: {
              tenant: { include: { merchantProfile: true } },
            },
          },
          customers: true,
        },
      }),
      this.prisma.platformAccount.count({ where }),
    ]);

    const items: PlatformAccountListItem[] = await Promise.all(
      accounts.map(async (account) => this.toListItem(account)),
    );

    let filteredItems = items;
    if (
      query.identity === 'DISTRIBUTOR' ||
      query.identity === 'PLATFORM_ADMIN'
    ) {
      filteredItems = [];
      for (const account of accounts) {
        const item = await this.toListItem(account);
        if (item.identities.includes(query.identity)) {
          filteredItems.push(item);
        }
      }
    }

    return {
      data: filteredItems,
      meta: {
        total:
          query.identity === 'DISTRIBUTOR' ||
          query.identity === 'PLATFORM_ADMIN'
            ? filteredItems.length
            : total,
        page,
        limit,
      },
      items: filteredItems,
      total:
        query.identity === 'DISTRIBUTOR' || query.identity === 'PLATFORM_ADMIN'
          ? filteredItems.length
          : total,
      page,
      limit,
    };
  }

  async getById(id: string): Promise<PlatformAccountDetail> {
    const account = await this.findAccountWithRelations(id);
    return this.buildDetail(account);
  }

  async updateProfile(
    id: string,
    dto: UpdatePlatformAccountDto,
  ): Promise<PlatformAccountDetail> {
    await this.requireAccount(id);
    const data: Prisma.PlatformAccountUpdateInput = {};
    if (dto.firstName !== undefined) data.firstName = dto.firstName;
    if (dto.lastName !== undefined) data.lastName = dto.lastName;
    if (dto.phone !== undefined) data.phone = dto.phone;

    await this.prisma.platformAccount.update({
      where: { id },
      data,
    });
    return this.getById(id);
  }

  async updateIdentities(
    id: string,
    dto: UpdatePlatformAccountIdentitiesDto,
  ): Promise<PlatformAccountDetail> {
    const account = await this.requireAccount(id);

    if (dto.platformAdminRole !== undefined) {
      await this.applyPlatformAdminRole(account, dto.platformAdminRole);
    }

    if (dto.distributor !== undefined) {
      if (dto.distributor === null || !dto.distributor.enabled) {
        await this.revokeDistributorIdentity(account);
      } else {
        await this.grantDistributorIdentity(
          account,
          dto.distributor.commissionRate ?? 0.1,
        );
      }
    }

    if (dto.merchantStaff?.length) {
      for (const assignment of dto.merchantStaff) {
        await this.applyMerchantStaffAssignment(account, assignment);
      }
    }

    return this.getById(id);
  }

  private async requireAccount(id: string) {
    const account = await this.prisma.platformAccount.findUnique({
      where: { id },
    });
    if (!account) {
      throw new NotFoundException('User not found');
    }
    return account;
  }

  private async findAccountWithRelations(id: string) {
    const account = await this.prisma.platformAccount.findUnique({
      where: { id },
      include: {
        customers: {
          include: {
            tenant: { include: { merchantProfile: true } },
            orders: { select: { id: true } },
          },
        },
        merchantUsers: {
          include: {
            tenant: { include: { merchantProfile: true } },
          },
        },
      },
    });
    if (!account) {
      throw new NotFoundException('User not found');
    }
    return account;
  }

  private async buildDetail(
    account: Prisma.PlatformAccountGetPayload<{
      include: {
        customers: {
          include: {
            tenant: { include: { merchantProfile: true } };
            orders: { select: { id: true } };
          };
        };
        merchantUsers: {
          include: {
            tenant: { include: { merchantProfile: true } };
          };
        };
      };
    }>,
  ): Promise<PlatformAccountDetail> {
    const listItem = await this.toListItem(account);
    const [platformUser, distributor] = await Promise.all([
      this.prisma.platformUser.findUnique({ where: { email: account.email } }),
      this.prisma.distributor.findUnique({ where: { accountId: account.id } }),
    ]);
    const activeDistributor =
      distributor ??
      (account.email
        ? await this.prisma.distributor.findFirst({
            where: {
              tenantId: null,
              isActive: true,
              email: { equals: account.email, mode: 'insensitive' },
            },
          })
        : null);

    return {
      ...listItem,
      platformAdminRole: platformUser?.role ?? null,
      distributorCommissionRate:
        activeDistributor?.isActive === true
          ? Number(activeDistributor.commissionRate)
          : null,
      consumerProfiles: account.customers.map((customer) => ({
        customerId: customer.id,
        tenantId: customer.tenantId,
        tenantSlug: customer.tenant.slug,
        businessName:
          customer.tenant.merchantProfile?.businessName ?? customer.tenant.slug,
        orderCount: customer.orders.length,
      })),
      merchantRoles: account.merchantUsers.map((user) => ({
        userId: user.id,
        tenantId: user.tenantId,
        tenantSlug: user.tenant.slug,
        businessName:
          user.tenant.merchantProfile?.businessName ?? user.tenant.slug,
        role: user.role,
        onboardingStatus:
          user.tenant.merchantProfile?.onboardingStatus ?? 'DRAFT',
      })),
    };
  }

  private async applyPlatformAdminRole(
    account: PlatformAccount,
    role: PlatformRole | null,
  ) {
    if (role === null) {
      const existing = await this.prisma.platformUser.findUnique({
        where: { email: account.email },
      });
      if (existing) {
        await this.prisma.platformUser.delete({ where: { id: existing.id } });
      }
      return;
    }

    await this.prisma.platformUser.upsert({
      where: { email: account.email },
      create: {
        email: account.email,
        password: account.password,
        role,
      },
      update: { role },
    });
  }

  private async grantDistributorIdentity(
    account: PlatformAccount,
    commissionRate: number,
  ) {
    const byAccount = await this.prisma.distributor.findUnique({
      where: { accountId: account.id },
    });
    if (byAccount) {
      await this.prisma.distributor.update({
        where: { id: byAccount.id },
        data: {
          isActive: true,
          accountId: account.id,
          commissionRate,
        },
      });
      return;
    }

    const byEmail = account.email
      ? await this.prisma.distributor.findFirst({
          where: {
            tenantId: null,
            email: { equals: account.email, mode: 'insensitive' },
          },
        })
      : null;
    if (byEmail) {
      await this.prisma.distributor.update({
        where: { id: byEmail.id },
        data: {
          isActive: true,
          accountId: account.id,
          commissionRate,
        },
      });
      return;
    }

    const name =
      [account.firstName, account.lastName].filter(Boolean).join(' ') ||
      account.email.split('@')[0] ||
      account.email;

    await this.prisma.distributor.create({
      data: {
        tenantId: null,
        accountId: account.id,
        name,
        email: account.email,
        phone: account.phone,
        commissionRate,
        commissionType: CommissionType.PERCENT,
        isActive: true,
      },
    });
  }

  private async revokeDistributorIdentity(account: PlatformAccount) {
    let distributor = await this.prisma.distributor.findUnique({
      where: { accountId: account.id },
    });
    if (!distributor && account.email) {
      distributor = await this.prisma.distributor.findFirst({
        where: {
          tenantId: null,
          email: { equals: account.email, mode: 'insensitive' },
        },
      });
    }
    if (!distributor) {
      return;
    }

    await this.prisma.distributor.update({
      where: { id: distributor.id },
      data: { isActive: false, accountId: null },
    });
  }

  private async applyMerchantStaffAssignment(
    account: PlatformAccount,
    assignment: { tenantId: string; enabled: boolean },
  ) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: assignment.tenantId },
    });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const existing = await this.prisma.user.findFirst({
      where: { tenantId: assignment.tenantId, accountId: account.id },
    });

    if (assignment.enabled) {
      if (existing) {
        return;
      }
      await this.prisma.user.create({
        data: {
          tenantId: assignment.tenantId,
          accountId: account.id,
          email: account.email,
          role: MerchantRole.MERCHANT_STAFF,
        },
      });
      return;
    }

    if (!existing) {
      return;
    }
    if (existing.role === MerchantRole.MERCHANT_OWNER) {
      throw new BadRequestException(
        'Cannot remove merchant owner via this endpoint',
      );
    }
    await this.prisma.user.delete({ where: { id: existing.id } });
  }

  private async toListItem(
    account: Prisma.PlatformAccountGetPayload<{
      include: {
        merchantUsers: {
          include: { tenant: { include: { merchantProfile: true } } };
        };
        customers: true;
      };
    }>,
  ): Promise<PlatformAccountListItem> {
    const identities = await this.platformAccounts.computeIdentities(account);
    const merchantNames = [
      ...new Set(
        account.merchantUsers
          .filter((u) => u.role === MerchantRole.MERCHANT_OWNER)
          .map((u) => u.tenant.merchantProfile?.businessName)
          .filter((name): name is string => Boolean(name)),
      ),
    ];
    return {
      ...this.platformAccounts.toAccountSummary(account),
      identities,
      merchantNames,
    };
  }
}
