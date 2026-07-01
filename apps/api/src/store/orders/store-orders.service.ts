/**
 * StoreOrdersService - 商店订单服务
 *
 * 负责处理商店消费者的订单相关功能，包括：
 * - 获取订单列表
 * - 获取订单详情
 * - 获取自提二维码（用于到店取货验证）
 *
 * 数据筛选规则：
 * - 订单必须属于当前登录的消费者
 * - 订单必须属于当前商户商店
 * - 按创建时间倒序排列（最新订单在前）
 *
 * @service StoreOrdersService
 */

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { DeliveryAddress, StoreOrderDetail, StoreOrderListItem } from '@meridian/shared';
import { FulfillmentType, OrderStatus } from '@prisma/client';
import { OrderStatus as SharedOrderStatus } from '@meridian/shared';
import { FulfillmentService } from '../../fulfillment/fulfillment.service';
import { PrismaService } from '../../prisma/prisma.service';
import { StoreTenantService } from '../common/store-tenant.service';

/**
 * 可注入的订单服务
 * 提供消费者订单查询功能
 */
@Injectable()
export class StoreOrdersService {
  /**
   * 构造函数 - 注入所需依赖
   * @param prisma - Prisma 数据库服务
   * @param storeTenant - 商店租户解析服务
   * @param fulfillmentService - 履约服务（自提码生成）
   */
  constructor(
    private readonly prisma: PrismaService,
    private readonly storeTenant: StoreTenantService,
    private readonly fulfillmentService: FulfillmentService,
  ) {}

  /**
   * 获取消费者的订单列表
   *
   * 功能：获取当前消费者在指定商店的所有订单
   *
   * @param slug - 商户商店的 URL 标识
   * @param customerId - 消费者用户 ID
   * @returns 订单列表（简化信息，不包含详细商品）
   *
   * @example 返回数据结构
   * [{
   *   id: "order_xxx",
   *   status: "PAID",
   *   fulfillmentType: "PICKUP",
   *   currency: "cny",
   *   total: 199.00,
   *   createdAt: "2024-01-15T10:30:00.000Z",
   *   lineCount: 3
   * }]
   */
  async listForCustomer(
    slug: string,
    customerId: string,
  ): Promise<StoreOrderListItem[]> {
    // 解析并验证商户商店
    const { tenant } = await this.storeTenant.resolveApprovedTenant(slug);

    // 查询订单列表
    const orders = await this.prisma.order.findMany({
      where: { tenantId: tenant.id, customerId },
      include: { _count: { select: { lines: true } } },  // 统计订单商品数量
      orderBy: { createdAt: 'desc' },  // 最新订单在前
    });

    // 映射为简化格式
    return orders.map((order) => ({
      id: order.id,
      status: order.status as SharedOrderStatus,
      fulfillmentType: order.fulfillmentType,
      currency: order.currency,
      total: Number(order.total),
      createdAt: order.createdAt.toISOString(),
      lineCount: order._count.lines,
    }));
  }

  /**
   * 获取订单详情
   *
   * 功能：获取指定订单的完整信息，包括商品明细
   *
   * @param slug - 商户商店的 URL 标识
   * @param customerId - 消费者用户 ID
   * @param orderId - 订单 ID
   * @returns 订单详情对象
   * @throws NotFoundException - 订单不存在或不属于该消费者
   */
  async getForCustomer(
    slug: string,
    customerId: string,
    orderId: string,
  ): Promise<StoreOrderDetail> {
    // 解析并验证商户商店
    const { tenant } = await this.storeTenant.resolveApprovedTenant(slug);

    // 查询订单
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId: tenant.id, customerId },
      include: { lines: true },  // 包含商品明细
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // 返回完整订单信息
    return {
      id: order.id,
      status: order.status as SharedOrderStatus,
      fulfillmentType: order.fulfillmentType,
      currency: order.currency,
      total: Number(order.total),
      subtotal: Number(order.subtotal),
      tax: Number(order.tax),
      // 仅对未验证的自提订单返回自提码
      pickupCode:
        order.fulfillmentType === FulfillmentType.PICKUP && !order.pickupVerifiedAt
          ? order.pickupCode
          : null,
      pickupVerifiedAt: order.pickupVerifiedAt?.toISOString() ?? null,
      deliveryAddress: order.deliveryAddress as DeliveryAddress | null,
      shippedAt: order.shippedAt?.toISOString() ?? null,
      createdAt: order.createdAt.toISOString(),
      lineCount: order.lines.length,
      lines: order.lines.map((line) => ({
        id: line.id,
        productName: line.productName,
        variantName: line.variantName,
        quantity: line.quantity,
        unitPrice: Number(line.unitPrice),
        lineTotal: Number(line.lineTotal),
      })),
    };
  }

  /**
   * 获取自提二维码
   *
   * 功能：为自提订单生成二维码，供商家扫描验证
   *
   * 业务规则：
   * - 必须是自提（PICKUP）订单
   * - 订单尚未被验证（pickupVerifiedAt 为 null）
   * - 自提码必须已生成（支付完成后生成）
   *
   * @param slug - 商户商店的 URL 标识
   * @param customerId - 消费者用户 ID
   * @param orderId - 订单 ID
   * @returns 包含 orderId、pickupCode 和二维码 payload
   * @throws NotFoundException - 订单不存在
   * @throws BadRequestException - 订单不是自提类型、已验证或自提码未生成
   */
  async getPickupToken(slug: string, customerId: string, orderId: string) {
    // 解析并验证商户商店
    const { tenant } = await this.storeTenant.resolveApprovedTenant(slug);

    // 查询订单
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId: tenant.id, customerId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // 验证订单类型必须是自提
    if (order.fulfillmentType !== FulfillmentType.PICKUP) {
      throw new BadRequestException('Order is not a pickup order');
    }

    // 验证订单尚未被提货
    if (order.pickupVerifiedAt) {
      throw new BadRequestException('Pickup already verified');
    }

    // 验证自提码已生成
    if (!order.pickupCode) {
      throw new BadRequestException('Pickup code not yet available');
    }

    // 生成二维码 payload
    return {
      orderId: order.id,
      pickupCode: order.pickupCode,
      qrPayload: this.fulfillmentService.buildPickupQrPayload(
        order.id,
        order.pickupCode,
      ),
    };
  }
}
