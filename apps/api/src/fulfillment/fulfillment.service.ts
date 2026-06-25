import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHmac } from 'crypto';
import {
  FulfillmentType,
  OrderStatus,
  Prisma,
} from '@prisma/client';
import { CommissionService } from '../commission/commission.service';
import { InventoryService } from '../inventory/inventory.service';
import { PrismaService } from '../prisma/prisma.service';

function generatePickupCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

@Injectable()
export class FulfillmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
    private readonly commissionService: CommissionService,
  ) {}

  async generatePickupCodeForOrder(orderId: string): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt++) {
      const code = generatePickupCode();
      try {
        await this.prisma.order.update({
          where: { id: orderId },
          data: { pickupCode: code },
        });
        return code;
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002'
        ) {
          continue;
        }
        throw err;
      }
    }
    throw new ConflictException('Could not generate unique pickup code');
  }

  async listPickupPending(tenantId: string) {
    return this.prisma.order.findMany({
      where: {
        tenantId,
        status: OrderStatus.PAID,
        fulfillmentType: FulfillmentType.PICKUP,
        pickupVerifiedAt: null,
      },
      include: { lines: true, customer: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async verifyPickup(
    tenantId: string,
    orderId: string,
    code: string,
    actorUserId: string,
  ) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId },
      include: { lines: true, commissionEntry: true },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.fulfillmentType !== FulfillmentType.PICKUP) {
      throw new BadRequestException('Order is not a pickup order');
    }
    if (order.status !== OrderStatus.PAID) {
      throw new BadRequestException('Order is not awaiting pickup verification');
    }
    if (order.pickupVerifiedAt) {
      throw new ConflictException('Order already verified');
    }
    if (order.pickupCode !== code) {
      throw new BadRequestException('Invalid pickup code');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.FULFILLED,
          pickupVerifiedAt: new Date(),
          pickupVerifiedByUserId: actorUserId,
        },
      });

      const defaultWarehouse = await tx.warehouse.findFirst({
        where: { tenantId, isDefault: true },
      });
      if (!defaultWarehouse) {
        throw new ConflictException('Default warehouse not configured');
      }

      for (const line of order.lines) {
        if (!line.variantId) continue;
        await this.inventoryService.applyQuantityDeltaInTx(
          tx,
          tenantId,
          defaultWarehouse.id,
          line.variantId,
          -line.quantity,
        );
        await this.inventoryService.syncVariantInventoryCache(line.variantId, tx);
      }
    });

    await this.commissionService.accrueOnFulfilled(orderId);
    return { orderId, status: OrderStatus.FULFILLED };
  }

  async shipDelivery(orderId: string, platformUserId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { lines: { include: { variant: true } }, commissionEntry: true },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.fulfillmentType !== FulfillmentType.DELIVERY) {
      throw new BadRequestException('Order is not a delivery order');
    }
    if (order.status !== OrderStatus.PAID) {
      throw new BadRequestException('Order is not awaiting shipment');
    }
    if (order.shippedAt) {
      throw new ConflictException('Order already shipped');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.FULFILLED,
          shippedAt: new Date(),
          shippedByPlatformUserId: platformUserId,
        },
      });

      for (const line of order.lines) {
        const masterSkuId = line.variant?.masterSkuId;
        if (!masterSkuId) {
          throw new BadRequestException(
            `Variant ${line.variantName} is not linked to master SKU`,
          );
        }
        const masterSku = await tx.masterSku.findUnique({
          where: { id: masterSkuId },
        });
        if (!masterSku || masterSku.quantityOnHand < line.quantity) {
          throw new BadRequestException('Insufficient master SKU inventory');
        }

        await tx.masterSku.update({
          where: { id: masterSkuId },
          data: {
            quantityOnHand: { decrement: line.quantity },
            cumulativeShippedQty: { increment: line.quantity },
          },
        });

        const wholesalePrice = masterSku.wholesalePrice;
        const lineTotal = new Prisma.Decimal(
          (Number(wholesalePrice) * line.quantity).toFixed(2),
        );
        await tx.deliveryAllocationLedger.create({
          data: {
            orderId: order.id,
            tenantId: order.tenantId,
            masterSkuId,
            quantity: line.quantity,
            wholesalePrice,
            lineTotal,
          },
        });
      }
    });

    await this.commissionService.accrueOnFulfilled(orderId);
    return { orderId, status: OrderStatus.FULFILLED };
  }

  buildPickupQrPayload(orderId: string, pickupCode: string): string {
    const payload: Record<string, string> = { orderId, code: pickupCode };
    const secret = process.env.PICKUP_QR_SECRET;
    if (secret) {
      payload.sig = createHmac('sha256', secret)
        .update(`${orderId}:${pickupCode}`)
        .digest('hex')
        .slice(0, 16);
    }
    return JSON.stringify(payload);
  }
}
