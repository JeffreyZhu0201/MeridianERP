import { Injectable, NotFoundException } from '@nestjs/common';
import { FulfillmentType } from '@prisma/client';
import { FulfillmentService } from '../../fulfillment/fulfillment.service';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * 平台订单服务 - 提供平台管理员查看和操作商户订单的功能
 *
 * 功能范围：
 * - 分页查询所有订单（支持按状态、履约类型筛选）
 * - 查看订单详情
 * - 发起配送发货（平台代发）
 *
 * 注意：平台管理员只能查看和操作订单，无法直接修改订单内容
 */
@Injectable()
export class PlatformOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fulfillmentService: FulfillmentService,
  ) {}

  /**
   * 分页查询订单列表
   *
   * @param page - 页码（默认1）
   * @param limit - 每页数量（默认20）
   * @param status - 可选，按订单状态筛选
   * @param fulfillmentType - 可选，按履约类型筛选（DELIVERY/PICKUP）
   * @returns 分页结果，包含订单列表和分页元数据
   */
  async findAll(
    page = 1,
    limit = 20,
    status?: string,
    fulfillmentType?: string,
  ) {
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (fulfillmentType) where.fulfillmentType = fulfillmentType;

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        include: {
          tenant: {
            select: {
              id: true,
              slug: true,
              merchantProfile: { select: { businessName: true } },
            },
          },
          lines: true,
          commissionEntry: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      /** 订单列表，每条包含租户简化信息 */
      data: data.map((order) => ({
        ...order,
        tenant: {
          id: order.tenant.id,
          slug: order.tenant.slug,
          businessName: order.tenant.merchantProfile?.businessName,
        },
      })),
      /** 分页元数据 */
      meta: { total, page, limit },
    };
  }

  /**
   * 发起配送发货
   *
   * 平台管理员可代替商户发起配送发货操作。
   * 实际发货逻辑由 FulfillmentService 处理。
   *
   * @param orderId - 订单 ID
   * @param platformUserId - 平台操作人 ID（用于审计）
   * @returns 发货结果
   */
  async ship(orderId: string, platformUserId: string) {
    return this.fulfillmentService.shipDelivery(orderId, platformUserId);
  }

  /**
   * 获取订单详情
   *
   * 返回订单的完整信息，包括：
   * - 基本信息（状态、金额、地址等）
   * - 关联商户信息
   * - 订单明细（商品列表）
   *
   * @param orderId - 订单 ID
   * @returns 订单详情
   * @throws NotFoundException - 订单不存在时抛出
   */
  async findOne(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        tenant: {
          select: {
            id: true,
            slug: true,
            merchantProfile: { select: { businessName: true } },
          },
        },
        lines: { include: { variant: { select: { sku: true } } } },
      },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return {
      id: order.id,
      status: order.status,
      fulfillmentType: order.fulfillmentType,
      currency: order.currency,
      total: order.total,
      guestEmail: order.guestEmail,
      deliveryAddress: order.deliveryAddress,
      createdAt: order.createdAt.toISOString(),
      tenant: {
        id: order.tenant.id,
        slug: order.tenant.slug,
        businessName: order.tenant.merchantProfile?.businessName ?? null,
      },
      lines: order.lines.map((line) => ({
        id: line.id,
        productName: line.productName,
        variantName: line.variantName,
        quantity: line.quantity,
        skuCode: line.variant?.sku ?? null,
      })),
    };
  }
}
