import { Injectable, NotFoundException } from '@nestjs/common';
import { MerchantRole, Prisma } from '@prisma/client';
import type {
  PlatformAccountDetail,
  PlatformAccountListItem,
  UserIdentity,
} from '@meridian/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { PlatformAccountsService } from '../accounts/platform-accounts.service';
import { ListPlatformUsersQueryDto } from './dto/list-platform-users-query.dto';

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
    if (query.identity === 'DISTRIBUTOR' || query.identity === 'PLATFORM_ADMIN') {
      filteredItems = [];
      for (const account of accounts) {
        const item = await this.toListItem(account);
        if (item.identities.includes(query.identity!)) {
          filteredItems.push(item);
        }
      }
    }

    return {
      data: filteredItems,
      meta: { total: query.identity === 'DISTRIBUTOR' || query.identity === 'PLATFORM_ADMIN' ? filteredItems.length : total, page, limit },
      items: filteredItems,
      total: query.identity === 'DISTRIBUTOR' || query.identity === 'PLATFORM_ADMIN' ? filteredItems.length : total,
      page,
      limit,
    };
  }

  async getById(id: string): Promise<PlatformAccountDetail> {
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

    const listItem = await this.toListItem(account);
    return {
      ...listItem,
      consumerProfiles: account.customers.map((customer) => ({
        customerId: customer.id,
        tenantId: customer.tenantId,
        tenantSlug: customer.tenant.slug,
        businessName: customer.tenant.merchantProfile?.businessName ?? customer.tenant.slug,
        orderCount: customer.orders.length,
      })),
      merchantRoles: account.merchantUsers.map((user) => ({
        userId: user.id,
        tenantId: user.tenantId,
        tenantSlug: user.tenant.slug,
        businessName: user.tenant.merchantProfile?.businessName ?? user.tenant.slug,
        role: user.role,
        onboardingStatus:
          user.tenant.merchantProfile?.onboardingStatus ?? 'DRAFT',
      })),
    };
  }

  private async toListItem(
    account: Prisma.PlatformAccountGetPayload<{
      include: {
        merchantUsers: { include: { tenant: { include: { merchantProfile: true } } } };
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
