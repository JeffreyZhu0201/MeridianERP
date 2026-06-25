import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CommissionType, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { EnvService } from '../../config/env.service';

function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const bytes = randomBytes(6);
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

@Injectable()
export class PlatformDistributorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly env: EnvService,
  ) {}

  async list() {
    const rows = await this.prisma.distributor.findMany({
      where: { tenantId: null },
      include: { _count: { select: { recruitedMerchants: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((d) => ({
      id: d.id,
      name: d.name,
      email: d.email,
      phone: d.phone,
      commissionRate: Number(d.commissionRate),
      commissionType: d.commissionType,
      isActive: d.isActive,
      portalEnabled: d.portalEnabled,
      recruitedMerchantCount: d._count.recruitedMerchants,
      createdAt: d.createdAt.toISOString(),
    }));
  }

  async create(dto: {
    name: string;
    email?: string;
    phone?: string;
    commissionRate: number;
    commissionType?: CommissionType;
  }) {
    return this.prisma.distributor.create({
      data: {
        tenantId: null,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
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
        const baseUrl = this.env.get('MERCHANT_APP_URL') ?? 'http://localhost:3002';
        return {
          id: invite.id,
          code: invite.code,
          distributorId,
          expiresAt: invite.expiresAt?.toISOString() ?? null,
          revokedAt: null,
          useCount: 0,
          url: `${baseUrl}/register?invite=${code}`,
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
