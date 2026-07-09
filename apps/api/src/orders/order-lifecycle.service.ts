import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FulfillmentType,
  LedgerStatus,
  OrderStatus,
  Prisma,
} from '@prisma/client';
import { FulfillmentService } from '../fulfillment/fulfillment.service';
import { PaymentService } from '../payment/payment.service';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_PENDING_EXPIRY_MINUTES = 30;

@Injectable()
export class OrderLifecycleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly payment: PaymentService,
    private readonly fulfillment: FulfillmentService,
  ) {}

  async cancelPendingPayment(params: {
    orderId: string;
    tenantId?: string;
    customerId?: string;
  }) {
    const order = await this.findOrderOrThrow(params.orderId, params.tenantId);
    if (params.customerId && order.customerId !== params.customerId) {
      throw new ForbiddenException('Order does not belong to this customer');
    }
    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new BadRequestException(
        'Only pending payment orders can be cancelled',
      );
    }

    await this.releaseReservations(order.id);

    return this.prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.CANCELLED },
    });
  }

  async refundPaidOrder(params: {
    orderId: string;
    tenantId?: string;
    allowFulfilled?: boolean;
  }) {
    const order = await this.findOrderOrThrow(params.orderId, params.tenantId, {
      includeLines: true,
      includeTenant: true,
    });

    if (order.status === OrderStatus.REFUNDED) {
      throw new BadRequestException('Order is already refunded');
    }
    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Cancelled orders cannot be refunded');
    }
    if (order.status === OrderStatus.FULFILLED && !params.allowFulfilled) {
      throw new BadRequestException(
        'Fulfilled orders require platform refund with inventory restore',
      );
    }
    if (
      order.status !== OrderStatus.PAID &&
      order.status !== OrderStatus.FULFILLED
    ) {
      throw new BadRequestException(
        'Only paid or fulfilled orders can be refunded',
      );
    }

    if (order.stripePaymentIntentId) {
      await this.payment.refundPaymentIntent(order.stripePaymentIntentId);
    }

    await this.prisma.$transaction(async (tx) => {
      if (order.status === OrderStatus.FULFILLED) {
        await this.restoreInventoryForFulfilledOrder(
          {
            id: order.id,
            tenantId: order.tenantId,
            fulfillmentType: order.fulfillmentType,
            tenant: order.tenant as {
              merchantProfile?: { isFlagship: boolean } | null;
            },
            lines: order.lines,
          },
          tx,
        );
      }
      await this.voidOrderCommission(order.id, tx);
      await tx.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.REFUNDED },
      });
    });

    await this.releaseReservations(order.id);

    return this.prisma.order.findUniqueOrThrow({ where: { id: order.id } });
  }

  async expirePendingOrders(
    maxAgeMinutes = DEFAULT_PENDING_EXPIRY_MINUTES,
  ): Promise<number> {
    const cutoff = new Date(Date.now() - maxAgeMinutes * 60_000);
    const stale = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.PENDING_PAYMENT,
        createdAt: { lt: cutoff },
      },
      select: { id: true },
      take: 100,
    });

    let expired = 0;
    for (const { id } of stale) {
      try {
        await this.cancelPendingPayment({ orderId: id });
        expired += 1;
      } catch {
        // skip races with concurrent payment
      }
    }
    return expired;
  }

  private async findOrderOrThrow(
    orderId: string,
    tenantId?: string,
    opts?: { includeLines?: boolean; includeTenant?: boolean },
  ) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        ...(tenantId ? { tenantId } : {}),
      },
      include: {
        lines: opts?.includeLines ?? false,
        tenant: opts?.includeTenant
          ? { include: { merchantProfile: { select: { isFlagship: true } } } }
          : false,
      },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  private async voidOrderCommission(
    orderId: string,
    tx: Prisma.TransactionClient,
  ) {
    const ledger = await tx.commissionLedger.findUnique({ where: { orderId } });
    if (!ledger || ledger.status === LedgerStatus.VOID) {
      return;
    }
    if (ledger.status === LedgerStatus.SETTLED) {
      throw new BadRequestException(
        'Cannot refund order with settled commission; contact finance',
      );
    }
    await tx.commissionLedger.update({
      where: { id: ledger.id },
      data: { status: LedgerStatus.VOID },
    });
  }

  private async restoreInventoryForFulfilledOrder(
    order: {
      id: string;
      tenantId: string;
      fulfillmentType: FulfillmentType;
      tenant: { merchantProfile?: { isFlagship: boolean } | null };
      lines: Array<{ variantId: string | null; quantity: number }>;
    },
    tx: Prisma.TransactionClient,
  ) {
    const isFlagship = order.tenant.merchantProfile?.isFlagship ?? false;

    if (order.fulfillmentType === FulfillmentType.PICKUP) {
      await this.fulfillment.restoreBranchStock(
        tx,
        order.tenantId,
        order.lines,
      );
      return;
    }

    if (order.fulfillmentType === FulfillmentType.DELIVERY && isFlagship) {
      await this.fulfillment.restoreMasterSkuStock(tx, order);
      return;
    }

    if (order.fulfillmentType === FulfillmentType.DELIVERY) {
      await this.fulfillment.restoreBranchStock(
        tx,
        order.tenantId,
        order.lines,
      );
    }
  }

  private async releaseReservations(_orderId: string) {
    // Sellable inventory for pending orders is derived from order status; no separate row.
  }

  async reserveForOrder(
    _tenantId: string,
    _orderId: string,
    _lines: Array<{ variantId: string | null; quantity: number }>,
  ) {
    // Reservation is implicit via PENDING_PAYMENT order lines (see getSellableQuantity).
  }
}
