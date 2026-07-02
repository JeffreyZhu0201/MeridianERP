import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHmac } from 'crypto';
import { FulfillmentType, OrderStatus, Prisma } from '@prisma/client';
import { CommissionService } from '../commission/commission.service';
import { InventoryService } from '../inventory/inventory.service';
import { PrismaService } from '../prisma/prisma.service';

function generatePickupCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Coordinates pickup verification and HQ delivery shipping.
 * Both paths mark orders fulfilled and trigger commission accrual after inventory side effects succeed.
 */
@Injectable()
export class FulfillmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
    private readonly commissionService: CommissionService,
  ) {}

  /** Assigns a unique 6-digit pickup code; retries on unique constraint conflict. */
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
        // P2002: 违反唯一约束（pickupCode 已存在）
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
        pickupVerifiedAt: null, // 尚未验证
      },
      include: { lines: true, customer: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Pickup verification: PAID pickup orders only; deducts default-warehouse variant stock.
   * Commission accrues after the transaction succeeds.
   */
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
      throw new BadRequestException(
        'Order is not awaiting pickup verification',
      );
    }
    if (order.pickupVerifiedAt) {
      throw new ConflictException('Order already verified');
    }
    if (order.pickupCode !== code) {
      throw new BadRequestException('Invalid pickup code');
    }

    // 事务处理：更新订单 + 扣减库存
    await this.prisma.$transaction(async (tx) => {
      // 更新订单状态为已履约
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.FULFILLED,
          pickupVerifiedAt: new Date(),
          pickupVerifiedByUserId: actorUserId,
        },
      });

      // 获取默认仓库
      const defaultWarehouse = await tx.warehouse.findFirst({
        where: { tenantId, isDefault: true },
      });
      if (!defaultWarehouse) {
        throw new ConflictException('Default warehouse not configured');
      }

      // 扣减每个订单行的门店 Variant 库存
      for (const line of order.lines) {
        if (!line.variantId) continue;
        // 扣减库存（负数）
        await this.inventoryService.applyQuantityDeltaInTx(
          tx,
          tenantId,
          defaultWarehouse.id,
          line.variantId,
          -line.quantity,
        );
        // 同步缓存
        await this.inventoryService.syncVariantInventoryCache(
          line.variantId,
          tx,
        );
      }
    });

    // 触发佣金计算（订单完成后应计佣金）
    await this.commissionService.accrueOnFulfilled(orderId);
    return { orderId, status: OrderStatus.FULFILLED };
  }

  /**
   * HQ delivery shipment: deducts Master SKU stock and writes DeliveryAllocationLedger.
   * Commission accrues after the transaction succeeds.
   */
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

    // 事务处理：更新订单 + 扣减 Master SKU + 创建台账
    await this.prisma.$transaction(async (tx) => {
      // 更新订单状态为已履约
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.FULFILLED,
          shippedAt: new Date(),
          shippedByPlatformUserId: platformUserId,
        },
      });

      // 处理每个订单行
      for (const line of order.lines) {
        const masterSkuId = line.variant?.masterSkuId;
        if (!masterSkuId) {
          throw new BadRequestException(
            `Variant ${line.variantName} is not linked to master SKU`,
          );
        }

        // 检查 Master SKU 库存是否充足
        const masterSku = await tx.masterSku.findUnique({
          where: { id: masterSkuId },
        });
        if (!masterSku || masterSku.quantityOnHand < line.quantity) {
          throw new BadRequestException('Insufficient master SKU inventory');
        }

        // 扣减 Master SKU 库存
        await tx.masterSku.update({
          where: { id: masterSkuId },
          data: {
            quantityOnHand: { decrement: line.quantity },
            cumulativeShippedQty: { increment: line.quantity },
          },
        });

        // 创建配送台账记录（用于佣金计算）
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

    // 触发佣金计算
    await this.commissionService.accrueOnFulfilled(orderId);
    return { orderId, status: OrderStatus.FULFILLED };
  }

  /** JSON payload for pickup QR; optional HMAC sig when PICKUP_QR_SECRET is set. */
  buildPickupQrPayload(orderId: string, pickupCode: string): string {
    const payload: Record<string, string> = { orderId, code: pickupCode };
    const secret = process.env.PICKUP_QR_SECRET;
    if (secret) {
      // 添加 HMAC 签名防伪
      payload.sig = createHmac('sha256', secret)
        .update(`${orderId}:${pickupCode}`)
        .digest('hex')
        .slice(0, 16);
    }
    return JSON.stringify(payload);
  }
}
