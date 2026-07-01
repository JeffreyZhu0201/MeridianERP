import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * 商户补货请求服务 (MerchantReplenishmentService)
 *
 * 负责商户向总部发起补货请求的管理。
 *
 * 功能：
 * 1. 补货请求列表查询（包含明细和主 SKU 信息）
 * 2. 创建补货请求
 * 3. 查询可用主 SKU（总部主商品列表）
 *
 * 业务场景：
 * 商户库存不足时，可向总部发起补货请求，
 * 请求会包含所需商品（MasterSku）和数量。
 */
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

