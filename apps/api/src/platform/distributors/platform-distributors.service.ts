import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CommissionType, OrderStatus, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { EnvService } from '../../config/env.service';
import { PlatformAccountsService } from '../accounts/platform-accounts.service';

function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const bytes = randomBytes(6);
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

function displayNameFromAccount(account: {
  email: string;
  firstName: string | null;
  lastName: string | null;
}): string {
  const parts = [account.firstName, account.lastName].filter(Boolean);
  if (parts.length > 0) return parts.join(' ');
  return account.email.split('@')[0] ?? account.email;
}

@Injectable()
export class PlatformDistributorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly env: EnvService,
    private readonly platformAccounts: PlatformAccountsService,
  ) {}

  private storeInviteBaseUrl(): string {
    return this.env.get('STORE_APP_URL') ?? 'http://localhost:3003';
  }

  private inviteUrl(code: string): string {
    return `${this.storeInviteBaseUrl()}/open-shop?invite=${code}`;
  }

  async list() {
    const rows = await this.prisma.distributor.findMany({
      where: { tenantId: null },
      include: {
        _count: { select: { recruitedMerchants: true } },
        account: { select: { id: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((d) => ({
      id: d.id,
      name: d.name,
      email: d.email,
      phone: d.phone,
      accountId: d.accountId,
      accountEmail: d.account?.email ?? null,
      commissionRate: Number(d.commissionRate),
      commissionType: d.commissionType,
      isActive: d.isActive,
      portalEnabled: d.portalEnabled,
      recruitedMerchantCount: d._count.recruitedMerchants,
      createdAt: d.createdAt.toISOString(),
    }));
  }

  async create(dto: {
    name?: string;
    email?: string;
    phone?: string;
    accountId?: string;
    commissionRate: number;
    commissionType?: CommissionType;
  }) {
    let name = dto.name?.trim();
    let email = dto.email?.trim();
    let phone = dto.phone?.trim();
    let accountId: string | undefined;

    if (dto.accountId) {
      const account = await this.platformAccounts.findById(dto.accountId);
      if (!account) {
        throw new NotFoundException('Account not found');
      }
      const existing = await this.prisma.distributor.findUnique({
        where: { accountId: account.id },
      });
      if (existing) {
        throw new ConflictException('Account is already linked to a promoter');
      }
      accountId = account.id;
      name = name || displayNameFromAccount(account);
      email = email || account.email;
      phone = phone || account.phone || undefined;
    }

    if (!name) {
      throw new BadRequestException('Name is required');
    }

    return this.prisma.distributor.create({
      data: {
        tenantId: null,
        accountId,
        name,
        email: email || null,
        phone: phone || null,
        commissionRate: dto.commissionRate,
        commissionType: dto.commissionType ?? CommissionType.PERCENT,
        isActive: true,
      },
    });
  }

  async update(
    id: string,
    dto: Partial<{
      name: string;
      email: string;
      phone: string;
      commissionRate: number;
      commissionType: CommissionType;
      isActive: boolean;
    }>,
  ) {
    await this.assertPlatformDistributor(id);
    return this.prisma.distributor.update({ where: { id }, data: dto });
  }

  async enablePortal(id: string, password: string) {
    const distributor = await this.assertPlatformDistributor(id);
    if (!distributor.email) {
      throw new BadRequestException('Distributor email is required for portal access');
    }
    const passwordHash = await bcrypt.hash(password, 10);
    return this.prisma.distributor.update({
      where: { id },
      data: { portalEnabled: true, passwordHash },
    });
  }

  async getById(id: string) {
    const d = await this.prisma.distributor.findFirst({
      where: { id, tenantId: null },
      include: { account: { select: { id: true, email: true } } },
    });
    if (!d) {
      throw new NotFoundException('Platform distributor not found');
    }
    const [recruitedCount, inviteCodes] = await Promise.all([
      this.prisma.merchantProfile.count({
        where: { recruitedByDistributorId: id },
      }),
      this.prisma.merchantRecruitInviteCode.findMany({
        where: { distributorId: id },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);
    return {
      id: d.id,
      name: d.name,
      email: d.email,
      phone: d.phone,
      accountId: d.accountId,
      accountEmail: d.account?.email ?? null,
      commissionRate: Number(d.commissionRate),
      commissionType: d.commissionType,
      isActive: d.isActive,
      portalEnabled: d.portalEnabled,
      recruitedMerchantCount: recruitedCount,
      createdAt: d.createdAt.toISOString(),
      inviteCodes: inviteCodes.map((inv) => ({
        id: inv.id,
        code: inv.code,
        expiresAt: inv.expiresAt?.toISOString() ?? null,
        revokedAt: inv.revokedAt?.toISOString() ?? null,
        useCount: inv.useCount,
        url: this.inviteUrl(inv.code),
      })),
    };
  }

  async createInviteCode(distributorId: string, expiresInDays?: number) {
    await this.assertPlatformDistributor(distributorId);
    for (let i = 0; i < 10; i++) {
      const code = generateInviteCode();
      try {
        const invite = await this.prisma.merchantRecruitInviteCode.create({
          data: {
            code,
            distributorId,
            expiresAt: expiresInDays
              ? new Date(Date.now() + expiresInDays * 86400000)
              : null,
          },
        });
        return {
          id: invite.id,
          code: invite.code,
          distributorId,
          expiresAt: invite.expiresAt?.toISOString() ?? null,
          revokedAt: null,
          useCount: 0,
          url: this.inviteUrl(code),
        };
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002'
        ) {
          continue;
        }
        throw err;
      }
    }
    throw new ConflictException('Could not generate invite code');
  }

  async revokeInviteCode(distributorId: string, codeId: string) {
    await this.assertPlatformDistributor(distributorId);
    const invite = await this.prisma.merchantRecruitInviteCode.findFirst({
      where: { id: codeId, distributorId },
    });
    if (!invite) throw new NotFoundException('Invite code not found');
    if (invite.revokedAt) {
      throw new BadRequestException('Invite code already revoked');
    }
    return this.prisma.merchantRecruitInviteCode.update({
      where: { id: codeId },
      data: { revokedAt: new Date() },
    });
  }

  async getBranches(distributorId: string) {
    await this.assertPlatformDistributor(distributorId);
    const windowStart = new Date();
    windowStart.setUTCDate(windowStart.getUTCDate() - 30);

    const merchants = await this.prisma.merchantProfile.findMany({
      where: { recruitedByDistributorId: distributorId },
      include: { tenant: true },
    });

    const summaries = await Promise.all(
      merchants.map(async (m) => {
        const agg = await this.prisma.order.aggregate({
          where: {
            tenantId: m.tenantId,
            status: { in: ['PAID', 'FULFILLED'] },
            createdAt: { gte: windowStart },
          },
          _sum: { total: true },
          _count: { _all: true },
        });
        return {
          tenantId: m.tenantId,
          merchantProfileId: m.id,
          businessName: m.businessName,
          slug: m.tenant.slug,
          recruitedAt: m.recruitedAt?.toISOString() ?? null,
          salesLast30Days: Number(agg._sum.total ?? 0),
          orderCountLast30Days: agg._count._all,
        };
      }),
    );
    return summaries;
  }

  async getCommissionEntries(
    distributorId: string,
    query: { page?: number; limit?: number } = {},
  ) {
    await this.assertPlatformDistributor(distributorId);
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: Prisma.CommissionLedgerWhereInput = { distributorId };

    const [rows, total] = await Promise.all([
      this.prisma.commissionLedger.findMany({
        where,
        include: {
          order: {
            select: {
              total: true,
              pickupVerifiedAt: true,
              shippedAt: true,
              status: true,
            },
          },
          tenant: {
            select: {
              merchantProfile: { select: { businessName: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.commissionLedger.count({ where }),
    ]);

    return {
      items: rows.map((row) => ({
        id: row.id,
        orderId: row.orderId,
        tenantId: row.tenantId,
        businessName: row.tenant.merchantProfile?.businessName ?? '—',
        customerOrderSequence: row.customerOrderSequence,
        orderTotal: row.order.total.toString(),
        amount: row.amount.toString(),
        status: row.status,
        fulfilledAt:
          row.order.pickupVerifiedAt?.toISOString() ??
          row.order.shippedAt?.toISOString() ??
          (row.order.status === OrderStatus.FULFILLED
            ? row.createdAt.toISOString()
            : null),
        createdAt: row.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
    };
  }

  private async assertPlatformDistributor(id: string) {
    const distributor = await this.prisma.distributor.findFirst({
      where: { id, tenantId: null },
    });
    if (!distributor) {
      throw new NotFoundException('Platform distributor not found');
    }
    return distributor;
  }
}
