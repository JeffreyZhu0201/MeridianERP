import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { EnvService } from '../../config/env.service';
import { JwtService } from '@nestjs/jwt';
import { BindType, LedgerStatus, OrderStatus, Prisma } from '@prisma/client';
import { computeQrStatus } from '@meridian/shared';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { eachUtcDay, parseDateRangeQuery } from '../../common/date-range';
import { decimalSumToString } from '../commissions/commission-mappers';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import {
  CreateDistributorDto,
  QrHistoryListQueryDto,
  UpdateDistributorDto,
} from './dto/distributor.dto';
import { DistributorPerformanceQueryDto } from './dto/distributor-performance-query.dto';
import { buildBindQrUrl } from './qr-url.helper';
import * as QRCode from 'qrcode';

const DEFAULT_EXPIRES_IN_DAYS = 7;

@Injectable()
export class DistributorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly env: EnvService,
  ) {}

  private assertOwner(user: AuthenticatedUser) {
    if (!user.roles.includes('MERCHANT_OWNER')) {
      throw new ForbiddenException('Merchant owner role required');
    }
  }

  private paginate(page = 1, limit = 20) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    return {
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
      page: safePage,
      limit: safeLimit,
    };
  }

  private appUrls(): { merchantAppUrl: string; storeAppUrl: string } {
    return {
      merchantAppUrl:
        this.env.get('MERCHANT_APP_URL', 'http://localhost:3002') ??
        'http://localhost:3002',
      storeAppUrl:
        this.env.get('STORE_APP_URL', 'http://localhost:3003') ??
        'http://localhost:3003',
    };
  }

  findAll(tenantId: string) {
    return this.prisma.distributor.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const distributor = await this.prisma.distributor.findFirst({
      where: { id, tenantId },
      include: { qrCodes: { orderBy: { createdAt: 'desc' }, take: 5 } },
    });
    if (!distributor) {
      throw new NotFoundException('Distributor not found');
    }
    return distributor;
  }

  async getPerformance(
    tenantId: string,
    id: string,
    query: DistributorPerformanceQueryDto,
  ) {
    const distributor = await this.prisma.distributor.findFirst({
      where: { id, tenantId },
      select: { id: true, name: true },
    });
    if (!distributor) {
      throw new NotFoundException('Distributor not found');
    }

    const range = parseDateRangeQuery(query);
    const boundAtFilter = { gte: range.from, lte: range.to };
    const orderWhere = {
      tenantId,
      distributorId: id,
      status: OrderStatus.PAID,
      createdAt: boundAtFilter,
    };
    const ledgerWhere = {
      tenantId,
      distributorId: id,
      createdAt: boundAtFilter,
    };

    const [
      bindingsMerchant,
      bindingsCustomer,
      orderAgg,
      commissionAccruedAgg,
      commissionSettledAgg,
      trendOrders,
    ] = await Promise.all([
      this.prisma.binding.count({
        where: {
          tenantId,
          distributorId: id,
          bindableType: BindType.MERCHANT,
          boundAt: boundAtFilter,
        },
      }),
      this.prisma.binding.count({
        where: {
          tenantId,
          distributorId: id,
          bindableType: BindType.CUSTOMER,
          boundAt: boundAtFilter,
        },
      }),
      this.prisma.order.aggregate({
        where: orderWhere,
        _count: { _all: true },
        _sum: { total: true },
      }),
      this.prisma.commissionLedger.aggregate({
        where: { ...ledgerWhere, status: LedgerStatus.ACCRUED },
        _sum: { amount: true },
      }),
      this.prisma.commissionLedger.aggregate({
        where: { ...ledgerWhere, status: LedgerStatus.SETTLED },
        _sum: { amount: true },
      }),
      this.prisma.order.findMany({
        where: orderWhere,
        select: {
          createdAt: true,
          total: true,
          commissionEntry: { select: { amount: true, status: true } },
        },
      }),
    ]);

    const commissionAccrued = decimalSumToString(commissionAccruedAgg._sum.amount);
    const commissionSettled = decimalSumToString(commissionSettledAgg._sum.amount);
    const commissionTotal = new Prisma.Decimal(commissionAccrued)
      .plus(commissionSettled)
      .toString();

    const trendMap = new Map<
      string,
      { orderCount: number; orderRevenue: Prisma.Decimal; commissionAccrued: Prisma.Decimal }
    >();
    for (const day of eachUtcDay(range.from, range.to)) {
      trendMap.set(day, {
        orderCount: 0,
        orderRevenue: new Prisma.Decimal(0),
        commissionAccrued: new Prisma.Decimal(0),
      });
    }

    for (const order of trendOrders) {
      const day = order.createdAt.toISOString().slice(0, 10);
      const bucket = trendMap.get(day);
      if (!bucket) continue;
      bucket.orderCount += 1;
      bucket.orderRevenue = bucket.orderRevenue.plus(order.total);
      if (order.commissionEntry?.status === LedgerStatus.ACCRUED) {
        bucket.commissionAccrued = bucket.commissionAccrued.plus(
          order.commissionEntry.amount,
        );
      }
    }

    const trend = [...trendMap.entries()].map(([date, bucket]) => ({
      date,
      orderCount: bucket.orderCount,
      orderRevenue: bucket.orderRevenue.toString(),
      commissionAccrued: bucket.commissionAccrued.toString(),
    }));

    return {
      distributorId: distributor.id,
      distributorName: distributor.name,
      bindingsMerchant,
      bindingsCustomer,
      attributedOrderCount: orderAgg._count._all,
      attributedOrderRevenue: decimalSumToString(orderAgg._sum.total),
      commissionAccrued,
      commissionSettled,
      commissionTotal,
      from: range.fromIso,
      to: range.toIso,
      trend,
    };
  }

  async create(tenantId: string, dto: CreateDistributorDto) {
    let commissionRate = dto.commissionRate;
    let commissionType = dto.commissionType;

    if (commissionRate == null || commissionType == null) {
      const settings = await this.prisma.tenantSettings.findUnique({
        where: { tenantId },
      });
      if (settings?.defaultCommissionRate != null) {
        commissionRate ??= Number(settings.defaultCommissionRate);
        commissionType ??= settings.defaultCommissionType ?? 'PERCENT';
      }
    }

    return this.prisma.distributor.create({
      data: {
        tenantId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        commissionRate: commissionRate ?? 0,
        commissionType: commissionType ?? 'PERCENT',
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateDistributorDto) {
    await this.findOne(tenantId, id);
    return this.prisma.distributor.update({
      where: { id },
      data: dto,
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    await this.prisma.distributor.delete({ where: { id } });
    return { deleted: true };
  }

  async enablePortal(
    user: AuthenticatedUser,
    tenantId: string,
    id: string,
    password: string,
  ) {
    this.assertOwner(user);

    const distributor = await this.findOne(tenantId, id);
    if (!distributor.email) {
      throw new BadRequestException(
        'Distributor must have an email before portal access can be enabled',
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const updated = await this.prisma.distributor.update({
      where: { id },
      data: {
        passwordHash,
        portalEnabled: true,
      },
    });

    return {
      id: updated.id,
      portalEnabled: updated.portalEnabled,
      email: updated.email,
    };
  }

  async generateQr(
    user: AuthenticatedUser,
    tenantId: string,
    id: string,
    bindType: BindType = BindType.MERCHANT,
    expiresInDays: number = DEFAULT_EXPIRES_IN_DAYS,
  ) {
    this.assertOwner(user);

    const distributor = await this.findOne(tenantId, id);
    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
    });
    const expiresAt = new Date(
      Date.now() + expiresInDays * 24 * 60 * 60 * 1000,
    );
    const token = this.jwt.sign(
      {
        distributorId: distributor.id,
        tenantId,
        bindType,
        purpose: 'bind',
        jti: randomUUID(),
      },
      {
        secret: this.env.getOrThrow('BIND_TOKEN_SECRET'),
        expiresIn: `${expiresInDays}d`,
      },
    );

    const qr = await this.prisma.$transaction(async (tx) => {
      await tx.distributorQrCode.updateMany({
        where: {
          distributorId: distributor.id,
          bindType,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { revokedAt: new Date() },
      });

      return tx.distributorQrCode.create({
        data: {
          distributorId: distributor.id,
          token,
          bindType,
          expiresAt,
        },
      });
    });

    const { merchantAppUrl, storeAppUrl } = this.appUrls();
    const url = buildBindQrUrl(
      bindType,
      tenant.slug,
      token,
      merchantAppUrl,
      storeAppUrl,
    );

    return {
      id: qr.id,
      token,
      url,
      bindType,
      expiresAt: expiresAt.toISOString(),
    };
  }

  async listQrHistory(
    tenantId: string,
    id: string,
    query: QrHistoryListQueryDto,
  ) {
    await this.findOne(tenantId, id);

    const { skip, take, page, limit } = this.paginate(query.page, query.limit);
    const where = {
      distributorId: id,
      ...(query.bindType ? { bindType: query.bindType } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.distributorQrCode.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.distributorQrCode.count({ where }),
    ]);

    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
    });
    const { merchantAppUrl, storeAppUrl } = this.appUrls();

    const items = rows.map((qr) => ({
      id: qr.id,
      bindType: qr.bindType,
      createdAt: qr.createdAt.toISOString(),
      expiresAt: qr.expiresAt.toISOString(),
      revokedAt: qr.revokedAt?.toISOString() ?? null,
      status: computeQrStatus(qr.revokedAt, qr.expiresAt),
      url: buildBindQrUrl(
        qr.bindType,
        tenant.slug,
        qr.token,
        merchantAppUrl,
        storeAppUrl,
      ),
    }));

    return { items, total, page, limit };
  }

  async downloadQrPng(tenantId: string, distributorId: string, qrId: string) {
    const distributor = await this.findOne(tenantId, distributorId);
    const qr = await this.prisma.distributorQrCode.findFirst({
      where: { id: qrId, distributorId },
    });
    if (!qr) {
      throw new NotFoundException('QR code not found');
    }

    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
    });
    const { merchantAppUrl, storeAppUrl } = this.appUrls();
    const url = buildBindQrUrl(
      qr.bindType,
      tenant.slug,
      qr.token,
      merchantAppUrl,
      storeAppUrl,
    );

    const slugOrId = tenant.slug || distributor.id;
    const filename = `distributor-${slugOrId}-${qr.bindType.toLowerCase()}-qr.png`;
    const buffer = await QRCode.toBuffer(url, {
      type: 'png',
      width: 512,
      margin: 2,
    });

    return { buffer, filename };
  }
}
