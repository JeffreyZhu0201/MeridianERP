import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { CommissionService } from '../../commission/commission.service';
import { PaymentService } from '../../payment/payment.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailQueueService } from '../../queue/email-queue.service';
import { StoreTenantService } from '../common/store-tenant.service';
import { CheckoutDto } from '../cart/dto/cart.dto';

const CART_INCLUDE = {
  items: {
    include: {
      variant: {
        include: { product: true },
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
    private readonly commissionService: CommissionService,
    private readonly emailQueue: EmailQueueService,
  ) {}

  async checkout(
    slug: string,
    dto: CheckoutDto,
    sessionId: string | undefined,
    user?: AuthenticatedUser,
  ) {
    const { tenant } = await this.storeTenant.resolveApprovedTenant(slug);

    let cart;
    if (user?.userId && user.tenantId === tenant.id) {
      cart = await this.prisma.cart.findFirst({
        where: { tenantId: tenant.id, customerId: user.userId },
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

    if (!user && !dto.guestEmail) {
      throw new BadRequestException('guestEmail is required for guest checkout');
    }

    for (const item of cart.items) {
      if (!item.variant.isActive || !item.variant.product.isPublished) {
        throw new BadRequestException('Cart contains unavailable items');
      }
      if (item.variant.inventory < item.quantity) {
        throw new BadRequestException(`Insufficient inventory for ${item.variant.name}`);
      }
    }

    const subtotal = cart.items.reduce(
      (sum, item) => sum + Number(item.variant.price) * item.quantity,
      0,
    );
    const tax = 0;
    const total = subtotal + tax;

    const order = await this.prisma.order.create({
      data: {
        tenantId: tenant.id,
        customerId: user?.userId ?? null,
        distributorId: cart.distributorId,
        status: OrderStatus.PENDING_PAYMENT,
        subtotal,
        tax,
        total,
        guestEmail: user ? null : dto.guestEmail!,
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
      throw new ForbiddenException('Simulate payment is only available in mock mode');
    }
    await this.markOrderPaid(order.id);
    return { orderId: order.id, status: OrderStatus.PAID };
  }

  private async markOrderPaid(orderId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { lines: true },
    });
    if (!order || order.status !== OrderStatus.PENDING_PAYMENT) {
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PAID },
      });

      for (const line of order.lines) {
        if (!line.variantId) continue;
        await tx.productVariant.update({
          where: { id: line.variantId },
          data: { inventory: { decrement: line.quantity } },
        });
      }

      if (order.customerId) {
        const cart = await tx.cart.findFirst({
          where: { tenantId: order.tenantId, customerId: order.customerId },
        });
        if (cart) {
          await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
        }
      }
    });

    await this.commissionService.accrueOnPaid(orderId);
    await this.emailQueue.sendMerchantWelcome(
      order.guestEmail ?? 'customer@store.test',
      `Order ${orderId}`,
    );
  }
}
