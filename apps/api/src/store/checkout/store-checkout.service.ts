import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FulfillmentType, OrderStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { FulfillmentService } from '../../fulfillment/fulfillment.service';
import { InventoryService } from '../../inventory/inventory.service';
import { PaymentService } from '../../payment/payment.service';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryQueueService } from '../../queue/inventory-queue.service';
import { EmailQueueService } from '../../queue/email-queue.service';
import { StoreAuthService } from '../auth/store-auth.service';
import { StoreTenantService } from '../common/store-tenant.service';
import { CheckoutDto } from '../cart/dto/cart.dto';

const CART_INCLUDE = {
  items: {
    include: {
      variant: {
        include: { product: true, masterSku: true },
      },
    },
  },
};

@Injectable()
export class StoreCheckoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storeTenant: StoreTenantService,
    private readonly paymentService: PaymentService,
    private readonly emailQueue: EmailQueueService,
    private readonly inventoryService: InventoryService,
    private readonly inventoryQueue: InventoryQueueService,
    private readonly fulfillmentService: FulfillmentService,
    private readonly storeAuth: StoreAuthService,
  ) {}

  async checkout(
    slug: string,
    dto: CheckoutDto,
    sessionId: string | undefined,
    user?: AuthenticatedUser,
  ) {
    const { tenant } = await this.storeTenant.resolveApprovedTenant(slug);
    let cart;
    let customerId: string | null = null;
    if (user?.userId) {
      customerId = await this.storeAuth.resolveCustomerId(
        user.userId,
        tenant.id,
      );
      cart = await this.prisma.cart.findFirst({
        where: { tenantId: tenant.id, customerId },
        include: CART_INCLUDE,
      });
    } else {
      if (!sessionId) {
        throw new BadRequestException('X-Cart-Session header is required');
      }
      cart = await this.prisma.cart.findFirst({
        where: { tenantId: tenant.id, sessionId, customerId: null },
        include: CART_INCLUDE,
      });
    }
    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }
    if (
      dto.fulfillmentType === FulfillmentType.DELIVERY &&
      !dto.deliveryAddress
    ) {
      throw new BadRequestException(
        'deliveryAddress is required for delivery orders',
      );
    }
    if (!user && !dto.guestEmail) {
      throw new BadRequestException(
        'guestEmail is required for guest checkout',
      );
    }
    for (const item of cart.items) {
      if (!item.variant.isActive || !item.variant.product.isPublished) {
        throw new BadRequestException('Cart contains unavailable items');
      }
      if (dto.fulfillmentType === FulfillmentType.PICKUP) {
        const sellable = await this.inventoryService.getSellableQuantity(
          item.variantId,
        );
        if (sellable < item.quantity) {
          throw new BadRequestException(
            `Insufficient inventory for ${item.variant.name}`,
          );
        }
      }
      if (dto.fulfillmentType === FulfillmentType.DELIVERY) {
        const masterSkuId = item.variant.masterSkuId;
        if (!masterSkuId) {
          throw new BadRequestException(
            `${item.variant.name} is not available for delivery`,
          );
        }
        const masterSku = await this.prisma.masterSku.findUnique({
          where: { id: masterSkuId },
        });
        if (!masterSku || masterSku.quantityOnHand < item.quantity) {
          throw new BadRequestException(
            `Insufficient inventory for ${item.variant.name}`,
          );
        }
      }
    }
    const subtotal = cart.items.reduce(
      (sum, item) =>
        sum.add(
          new Prisma.Decimal(item.variant.price).mul(item.quantity),
        ),
      new Prisma.Decimal(0),
    );
    const tax = new Prisma.Decimal(0);
    const total = subtotal.add(tax);
    const order = await this.prisma.order.create({
      data: {
        tenantId: tenant.id,
        customerId: customerId ?? null,
        status: OrderStatus.PENDING_PAYMENT, // 待支付状态
        fulfillmentType: dto.fulfillmentType,
        deliveryAddress:
          dto.fulfillmentType === FulfillmentType.DELIVERY &&
          dto.deliveryAddress
            ? (dto.deliveryAddress as unknown as Prisma.InputJsonValue)
            : undefined,
        subtotal,
        tax,
        total,
        guestEmail: user ? null : dto.guestEmail!, // 已登录用户不需要 guestEmail
        lines: {
          create: cart.items.map((item) => ({
            variantId: item.variantId,
            productName: item.variant.product.name,
            variantName: item.variant.name,
            quantity: item.quantity,
            unitPrice: item.variant.price,
            unitWholesalePrice: item.variant.masterSku?.wholesalePrice ?? null,
            lineTotal: new Prisma.Decimal(
              (Number(item.variant.price) * item.quantity).toFixed(2),
            ),
          })),
        },
      },
      include: { lines: true },
    });
    const paymentIntent = await this.paymentService.createPaymentIntent({
      orderId: order.id,
      amount: Number(order.total),
      currency: order.currency,
      metadata: { tenantSlug: slug },
    });
    await this.prisma.order.update({
      where: { id: order.id },
      data: { stripePaymentIntentId: paymentIntent.id },
    });
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

  async confirmPaymentByIntent(paymentIntentId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { stripePaymentIntentId: paymentIntentId },
      include: { lines: true },
    });
    if (!order || order.status !== OrderStatus.PENDING_PAYMENT) {
      return;
    }
    await this.markOrderPaid(order.id);
  }

  async confirmPaymentByOrderId(
    slug: string,
    orderId: string,
    tenantId: string,
  ) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new BadRequestException('Order is not awaiting payment');
    }
    if (!this.paymentService.isMockMode()) {
      throw new ForbiddenException(
        'Simulate payment is only available in mock mode',
      );
    }
    await this.markOrderPaid(order.id);
    return { orderId: order.id, status: OrderStatus.PAID };
  }

  private async markOrderPaid(orderId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { lines: true, customer: true },
    });

    if (!order || order.status !== OrderStatus.PENDING_PAYMENT) {
      return;
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PAID },
      });
      if (order.customerId) {
        const cart = await tx.cart.findFirst({
          where: { tenantId: order.tenantId, customerId: order.customerId },
        });
        if (cart) {
          await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
        }
      }
    });
    if (order.fulfillmentType === FulfillmentType.PICKUP) {
      await this.fulfillmentService.generatePickupCodeForOrder(orderId);
    }
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
