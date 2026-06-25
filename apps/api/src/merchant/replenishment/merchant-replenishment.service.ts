import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ReplenishmentRequestStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MerchantReplenishmentService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: string) {
    return this.prisma.replenishmentRequest.findMany({
      where: { tenantId },
      include: { lines: { include: { masterSku: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(
    tenantId: string,
    lines: Array<{ masterSkuId: string; quantity: number }>,
    note?: string,
  ) {
    if (lines.length === 0) {
      throw new BadRequestException('At least one line is required');
    }
    return this.prisma.replenishmentRequest.create({
      data: {
        tenantId,
        note,
        lines: { create: lines },
      },
      include: { lines: true },
    });
  }

  async listAvailableSkus() {
    return this.prisma.masterSku.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }
}

@Injectable()
export class PlatformReplenishmentService {
  constructor(private readonly prisma: PrismaService) {}

  async list(status?: ReplenishmentRequestStatus) {
    return this.prisma.replenishmentRequest.findMany({
      where: status ? { status } : undefined,
      include: {
        tenant: { include: { merchantProfile: true } },
        lines: { include: { masterSku: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approve(id: string, platformUserId: string) {
    const req = await this.prisma.replenishmentRequest.findUnique({
      where: { id },
    });
    if (!req) throw new NotFoundException('Replenishment request not found');
    if (req.status !== ReplenishmentRequestStatus.PENDING) {
      throw new BadRequestException('Request is not pending');
    }
    return this.prisma.replenishmentRequest.update({
      where: { id },
      data: {
        status: ReplenishmentRequestStatus.APPROVED,
        reviewedAt: new Date(),
        reviewedByPlatformUserId: platformUserId,
      },
    });
  }
}
