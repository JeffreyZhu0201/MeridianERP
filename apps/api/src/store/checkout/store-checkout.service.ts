/**
 * StoreCheckoutService - 商店结账服务
 *
 * 负责处理商店前端的下单和支付流程，包括：
 * - 创建订单（checkout）
 * - 处理支付成功回调（confirmPaymentByIntent）
 * - 模拟支付确认（confirmPaymentByOrderId）
 * - 标记订单为已支付（markOrderPaid）
 *
 * 业务流程：
 * 1. 用户从购物车发起结账
 * 2. 系统验证商品可用性和库存（自提模式）
 * 3. 创建待支付订单
 * 4. 调用支付服务创建 PaymentIntent
 * 5. 用户完成支付后，通过 webhook 或模拟接口确认
 * 6. 确认后：清空购物车、生成自提码（自提订单）、发送确认邮件
 *
 * 支持的履约类型：
 * - PICKUP: 到店自提
 * - DELIVERY: 配送到家
 *
 * @service StoreCheckoutService
 */

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FulfillmentType, OrderStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { CommissionService } from '../../commission/commission.service';
import { FulfillmentService } from '../../fulfillment/fulfillment.service';
import { InventoryService } from '../../inventory/inventory.service';
import { PaymentService } from '../../payment/payment.service';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryQueueService } from '../../queue/inventory-queue.service';
import { EmailQueueService } from '../../queue/email-queue.service';
import { StoreTenantService } from '../common/store-tenant.service';
import { CheckoutDto } from '../cart/dto/cart.dto';

/**
 * 购物车查询包含配置
 * 用于预加载购物车商品及其关联的商品和规格信息
 */
const CART_INCLUDE = {
  items: {
    include: {
      variant: {
        include: { product: true },
      },
    },
  },
};

/**
 * 可注入的结账服务
 * 处理商店下单和支付流程
 */
@Injectable()
export class StoreCheckoutService {
  /**
   * 构造函数 - 注入所有所需依赖
   * @param prisma - Prisma 数据库服务
   * @param storeTenant - 商店租户解析服务
   * @param paymentService - 支付服务（Stripe）
   * @param commissionService - 佣金计算服务
   * @param emailQueue - 邮件队列服务
   * @param inventoryService - 库存服务
   * @param inventoryQueue - 库存队列服务
   * @param fulfillmentService - 履约服务（自提码生成等）
   */
  constructor(
    private readonly prisma: PrismaService,
    private readonly storeTenant: StoreTenantService,
    private readonly paymentService: PaymentService,
    private readonly commissionService: CommissionService,
    private readonly emailQueue: EmailQueueService,
    private readonly inventoryService: InventoryService,
    private readonly inventoryQueue: InventoryQueueService,
    private readonly fulfillmentService: FulfillmentService,
  ) {}

  /**
   * 创建订单（结账）
   *
   * 业务逻辑：
   * 1. 解析商户商店，验证其已审批
   * 2. 获取用户购物车（已登录用户或游客 session）
   * 3. 验证购物车非空
   * 4. 验证配送地址（配送模式必需）
   * 5. 验证游客邮箱（未登录用户必需）
   * 6. 验证商品可用性和库存（自提模式）
   * 7. 计算订单金额
   * 8. 创建订单记录（状态：待支付）
   * 9. 创建 Stripe PaymentIntent
   * 10. 返回订单信息和支付密钥
   *
   * @param slug - 商户商店的 URL 标识
   * @param dto - 结账信息（履约类型、配送地址、游客邮箱）
   * @param sessionId - 游客会话 ID（用于游客购物车）
   * @param user - 已认证用户（可选）
   * @returns 订单信息和 Stripe PaymentIntent
   * @throws BadRequestException - 购物车为空、缺少必需字段、库存不足
   * @throws ForbiddenException - 非 Mock 模式下不允许模拟支付
   */
  async checkout(
    slug: string,
    dto: CheckoutDto,
    sessionId: string | undefined,
    user?: AuthenticatedUser,
  ) {
    // 1. 解析并验证商户商店
    const { tenant } = await this.storeTenant.resolveApprovedTenant(slug);

    // 2. 获取购物车（根据用户是否登录选择不同查询条件）
    let cart;
    if (user?.userId && user.tenantId === tenant.id) {
      // 已登录用户：按 customerId 查询
      cart = await this.prisma.cart.findFirst({
        where: { tenantId: tenant.id, customerId: user.userId },
        include: CART_INCLUDE,
      });
    } else {
      // 游客：按 sessionId 查询，且无 customerId
      if (!sessionId) {
        throw new BadRequestException('X-Cart-Session header is required');
      }
      cart = await this.prisma.cart.findFirst({
        where: { tenantId: tenant.id, sessionId, customerId: null },
        include: CART_INCLUDE,
      });
    }

    // 3. 验证购物车非空
    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // 4. 验证配送地址（配送模式必需）
    if (
      dto.fulfillmentType === FulfillmentType.DELIVERY &&
      !dto.deliveryAddress
    ) {
      throw new BadRequestException('deliveryAddress is required for delivery orders');
    }

    // 5. 验证游客邮箱（未登录用户必需）
    if (!user && !dto.guestEmail) {
      throw new BadRequestException('guestEmail is required for guest checkout');
    }

    // 6. 验证商品可用性和库存
    for (const item of cart.items) {
      // 检查商品和规格是否可用
      if (!item.variant.isActive || !item.variant.product.isPublished) {
        throw new BadRequestException('Cart contains unavailable items');
      }
      // 自提模式：检查库存是否充足
      if (dto.fulfillmentType === FulfillmentType.PICKUP) {
        const sellable = await this.inventoryService.getSellableQuantity(item.variantId);
        if (sellable < item.quantity) {
          throw new BadRequestException(`Insufficient inventory for ${item.variant.name}`);
        }
      }
    }

    // 7. 计算订单金额
    const subtotal = cart.items.reduce(
      (sum, item) => sum + Number(item.variant.price) * item.quantity,
      0,
    );
    const tax = 0;  // 暂不计算税费
    const total = subtotal + tax;

    // 8. 创建订单记录
    const order = await this.prisma.order.create({
      data: {
        tenantId: tenant.id,
        customerId: user?.userId ?? null,
        status: OrderStatus.PENDING_PAYMENT,  // 待支付状态
        fulfillmentType: dto.fulfillmentType,
        deliveryAddress:
          dto.fulfillmentType === FulfillmentType.DELIVERY && dto.deliveryAddress
            ? (dto.deliveryAddress as unknown as Prisma.InputJsonValue)
            : undefined,
        subtotal,
        tax,
        total,
        guestEmail: user ? null : dto.guestEmail!,  // 已登录用户不需要 guestEmail
        lines: {
          create: cart.items.map((item) => ({
            variantId: item.variantId,
            productName: item.variant.product.name,
            variantName: item.variant.name,
            quantity: item.quantity,
            unitPrice: item.variant.price,
            lineTotal: new Prisma.Decimal(
              (Number(item.variant.price) * item.quantity).toFixed(2),
            ),
          })),
        },
      },
      include: { lines: true },
    });

    // 9. 创建 Stripe PaymentIntent
    const paymentIntent = await this.paymentService.createPaymentIntent({
      orderId: order.id,
      amount: Number(order.total),
      currency: order.currency,
      metadata: { tenantSlug: slug },
    });

    // 更新订单的 PaymentIntent ID
    await this.prisma.order.update({
      where: { id: order.id },
      data: { stripePaymentIntentId: paymentIntent.id },
    });

    // 10. 返回订单和支付信息
    return {
      order: {
        id: order.id,
        status: order.status,
        subtotal: Number(order.subtotal),
        tax: Number(order.tax),
        total: Number(order.total),
        lines: order.lines,
      },
      paymentIntent: {
        id: paymentIntent.id,
        clientSecret: paymentIntent.clientSecret,
      },
      mockPayment: this.paymentService.isMockMode(),
    };
  }

  /**
   * 通过 PaymentIntent 确认支付
   *
   * 由 Stripe Webhook 调用，当 payment_intent.succeeded 事件发生时触发。
   * 根据 Stripe PaymentIntent ID 查找订单并标记为已支付。
   *
   * @param paymentIntentId - Stripe PaymentIntent ID
   * @returns void
   */
  async confirmPaymentByIntent(paymentIntentId: string): Promise<void> {
    // 查找关联的订单
    const order = await this.prisma.order.findUnique({
      where: { stripePaymentIntentId: paymentIntentId },
      include: { lines: true },
    });

    // 仅处理处于待支付状态的订单
    if (!order || order.status !== OrderStatus.PENDING_PAYMENT) {
      return;
    }

    // 标记订单为已支付
    await this.markOrderPaid(order.id);
  }

  /**
   * 通过订单 ID 模拟支付确认（仅 Mock 模式可用）
   *
   * 用于开发/测试环境，模拟用户完成支付。
   * 仅在 PaymentService 处于 Mock 模式时可用。
   *
   * @param slug - 商户商店的 URL 标识
   * @param orderId - 订单 ID
   * @param tenantId - 商户租户 ID（用于权限校验）
   * @returns 包含 orderId 和新状态的响应
   * @throws NotFoundException - 订单不存在
   * @throws BadRequestException - 订单不处于待支付状态
   * @throws ForbiddenException - 非 Mock 模式下调用
   */
  async confirmPaymentByOrderId(
    slug: string,
    orderId: string,
    tenantId: string,
  ) {
    // 查找订单
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // 验证订单状态
    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new BadRequestException('Order is not awaiting payment');
    }

    // 仅在 Mock 模式下允许模拟支付
    if (!this.paymentService.isMockMode()) {
      throw new ForbiddenException('Simulate payment is only available in mock mode');
    }

    // 标记订单为已支付
    await this.markOrderPaid(order.id);
    return { orderId: order.id, status: OrderStatus.PAID };
  }

  /**
   * 标记订单为已支付（私有方法）
   *
   * 执行支付完成后的处理：
   * 1. 在事务中更新订单状态
   * 2. 清空用户购物车（如果已登录）
   * 3. 如果是自提订单，生成自提码
   * 4. 发送订单确认邮件
   *
   * @param orderId - 订单 ID
   * @returns void
   */
  private async markOrderPaid(orderId: string): Promise<void> {
    // 获取订单详情
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { lines: true, customer: true },
    });

    if (!order || order.status !== OrderStatus.PENDING_PAYMENT) {
      return;
    }

    // 在事务中执行：
    // 1. 更新订单状态为已支付
    // 2. 清空用户购物车
    await this.prisma.$transaction(async (tx) => {
      // 更新订单状态
      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PAID },
      });

      // 如果是已登录用户，清空其购物车
      if (order.customerId) {
        const cart = await tx.cart.findFirst({
          where: { tenantId: order.tenantId, customerId: order.customerId },
        });
        if (cart) {
          await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
        }
      }
    });

    // 如果是自提订单，生成自提码
    if (order.fulfillmentType === FulfillmentType.PICKUP) {
      await this.fulfillmentService.generatePickupCodeForOrder(orderId);
    }

    // 发送订单确认邮件
    // 优先使用游客邮箱，其次使用注册用户邮箱
    const confirmationEmail = order.guestEmail ?? order.customer?.email;
    if (confirmationEmail) {
      await this.emailQueue.sendOrderConfirmation(
        order.tenantId,
        orderId,
        confirmationEmail,
      );
    }
  }
}
