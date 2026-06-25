import { BadRequestException, Injectable } from '@nestjs/common';
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

