import { Injectable, NotFoundException } from '@nestjs/common';
import { FulfillmentService } from '../../fulfillment/fulfillment.service';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * 商户订单服务 (MerchantOrdersService)
 *
 * 负责商户订单的查询和履约操作。
 *
 * 功能：
 * 1. 订单列表查询（包含订单明细、客户信息、佣金记录）
 * 2. 订单详情查询
 * 3. 待自提订单列表查询
 * 4. 自提核销（验证提货码）
 *
 * 履约类型：
 * - PICKUP: 到店自提
 * - DELIVERY: 配送到家
 *
 * 自提核销需要提供正确的提货码（code）才能完成。
 */
@Injectable()
export class MerchantOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fulfillmentService: FulfillmentService,
  ) {}

  findAll(tenantId: string) {
    return this.prisma.order.findMany({
      where: { tenantId },
      include: {
        lines: true,
        customer: { select: { id: true, email: true, firstName: true, lastName: true } },
        commissionEntry: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  listPickupPending(tenantId: string) {
    return this.fulfillmentService.listPickupPending(tenantId);
  }

  verifyPickup(tenantId: string, orderId: string, code: string, userId: string) {
    return this.fulfillmentService.verifyPickup(tenantId, orderId, code, userId);
  }

  async findOne(tenantId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, tenantId },
      include: {
        lines: { include: { variant: true } },
        customer: { select: { id: true, email: true, firstName: true, lastName: true } },
        commissionEntry: true,
      },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }
}
