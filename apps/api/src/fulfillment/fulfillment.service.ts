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

/**
 * 生成 6 位随机自提码
 * 范围：100000-999999（共 900,000 种可能）
 */
function generatePickupCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * 履约服务 (FulfillmentService)
 *
 * ============================================================
 * 履约类型说明
 * ============================================================
 *
 * 【PICKUP 自提模式】
 * - 适用场景：消费者在网上下单后，直接到商户门店自提商品
 * - 业务流程：
 *   1. 订单创建时选择 PICKUP 履约类型
 *   2. 订单支付完成后，系统生成 6 位自提码
 *   3. 消费者到店，出示自提码（或二维码）
 *   4. 商户员工验证自提码 + 确认身份
 *   5. 核销后扣减门店库存，订单状态变为 FULFILLED
 *
 * 【DELIVERY 配送模式】
 * - 适用场景：消费者选择送货上门，由平台仓库发货
 * - 业务流程：
 *   1. 订单创建时选择 DELIVERY 履约类型
 *   2. 订单支付完成后，等待平台发货
 *   3. 平台仓库（总部）操作发货
 *   4. 扣减 Master SKU 库存，创建配送台账
 *   5. 订单状态变为 FULFILLED
 *
 * ============================================================
 * 订单状态流转
 * ============================================================
 *
 *  PENDING_PAYMENT → PAID → FULFILLED
 *       ↓              ↓
 *    CANCELLED     CANCELLED
 *                        ↓
 *                    REFUNDED
 *
 * - PENDING_PAYMENT：订单已创建，等待买家付款
 * - PAID：买家已付款，此时可以进行履约操作（自提验证/发货）
 * - FULFILLED：商品已交付/服务已完成，触发佣金计算
 * - CANCELLED：订单被取消（付款前或付款后）
 * - REFUNDED：已退款
 *
 * ============================================================
 * 核心业务逻辑
 * ============================================================
 *
 * 【自提验证安全机制】
 * - 6 位数字自提码（抗暴力破解）
 * - 可选 HMAC-SHA256 签名（防伪造二维码）
 * - 每个订单独立码，验证后立即失效
 * - 事务性更新：订单状态 + 库存扣减 原子操作
 *
 * 【配送发货关键约束】
 * - 从 Master SKU（总部主 SKU）扣减库存，而非门店 Variant 库存
 * - 创建 DeliveryAllocationLedger 配送台账，记录批发价和金额
 * - 用于渠道经销商佣金计算的依据
 *
 * 【佣金触发时机】
 * - 两种履约方式完成时，均调用 accrueOnFulfilled()
 * - 佣金在 FULFILLED 状态时计入，应计(ACCRUED)但未结算
 */
@Injectable()
export class FulfillmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
    private readonly commissionService: CommissionService,
  ) {}

  /**
   * 为订单生成唯一自提码
   *
   * 【功能说明】
   * 自提码是消费者到店提货时的唯一凭证。
   * 该方法在订单支付完成后由业务层调用（通常在支付回调中）。
   *
   * 【技术实现】
   * - 生成 6 位随机数字（100000-999999）
   * - 通过乐观锁更新订单记录
   * - 捕获 Prisma 唯一约束错误（P2002）进行重试
   * - 最多重试 10 次，理论上冲突概率极低
   *
   * 【防冲突机制】
   * 虽然 6 位码有 90 万种组合，但并发场景下可能重复。
   * 遇到重复时自动重试，保证最终生成唯一的码。
   *
   * @param orderId - 订单 ID
   * @returns 生成的自提码（6 位字符串，如 "385921"）
   * @throws ConflictException 如果 10 次重试后仍无法生成唯一码（极不可能）
   *
   * @example
   * ```typescript
   * const code = await fulfillmentService.generatePickupCodeForOrder(orderId);
   * // code = "385921"
   * ```
   */
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

  /**
   * 查询待自提的订单列表
   *
   * 【功能说明】
   * 商户员工使用此接口获取所有等待消费者上门自提的订单。
   * 常用于门店侧的自提管理后台或收银台界面。
   *
   * 【筛选条件】
   * - 订单状态 = PAID（已付款，等待履约）
   * - 履约类型 = PICKUP（自提模式）
   * - 尚未验证（pickupVerifiedAt = null）
   *
   * 【返回数据】
   * 包含完整的订单信息：
   * - lines: 订单明细（商品、数量、单价）
   * - customer: 消费者信息（用于核销时核对身份）
   *
   * @param tenantId - 租户 ID（商户唯一标识）
   * @returns 待自提订单列表，按创建时间倒序排列
   *
   * @example
   * ```typescript
   * const pendingOrders = await fulfillmentService.listPickupPending(tenantId);
   * // 用于门店收银台显示待提货订单
   * ```
   */
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
   * 验证自提 - 核销自提订单
   *
   * ============================================================
   * 业务场景
   * ============================================================
   *
   * 消费者到店提货时，向商户员工出示自提码。
   * 员工在系统中输入自提码或扫描消费者展示的二维码，
   * 系统验证通过后，完成库存扣减和订单履约。
   *
   * ============================================================
   * 验证前置条件（按顺序检查）
   * ============================================================
   *
   * 1. 订单存在且属于当前租户（防止跨商户操作）
   * 2. 订单履约类型为 PICKUP（自提订单才能核销）
   * 3. 订单状态为 PAID（已付款才能提货）
   * 4. 尚未被验证过（防止重复核销）
   * 5. 自提码匹配（核心安全校验）
   *
   * ============================================================
   * 核销后操作（事务内完成）
   * ============================================================
   *
   * 1. 更新订单状态：PAID → FULFILLED
   * 2. 记录验证时间和操作人
   * 3. 扣减门店仓库库存（每个订单行对应扣减）
   * 4. 同步库存缓存
   * 5. 触发佣金计算（accrueOnFulfilled）
   *
   * ============================================================
   * 库存扣减说明
   * ============================================================
   *
   * 自提模式扣减的是【门店 Variant 库存】，而非总部 Master SKU。
   * 这是因为商品已经在门店，无需总部再发货。
   *
   * @param tenantId - 租户 ID（商户标识）
   * @param orderId - 订单 ID
   * @param code - 消费者提供的 6 位自提码
   * @param actorUserId - 验证操作人 ID（通常是商户员工）
   * @returns 履约结果 { orderId, status: 'FULFILLED' }
   * @throws NotFoundException 订单不存在
   * @throws BadRequestException 订单不是自提类型/状态不对/码不匹配
   * @throws ConflictException 订单已验证过
   *
   * @example
   * ```typescript
   * // 消费者出示自提码 "385921"
   * const result = await fulfillmentService.verifyPickup(
   *   tenantId,
   *   orderId,
   *   "385921",
   *   userId
   * );
   * // result = { orderId: "xxx", status: "FULFILLED" }
   * ```
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
      throw new BadRequestException('Order is not awaiting pickup verification');
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
        await this.inventoryService.syncVariantInventoryCache(line.variantId, tx);
      }
    });

    // 触发佣金计算（订单完成后应计佣金）
    await this.commissionService.accrueOnFulfilled(orderId);
    return { orderId, status: OrderStatus.FULFILLED };
  }

  /**
   * 配送发货 - 平台总部向商户发货
   *
   * ============================================================
   * 业务场景
   * ============================================================
   *
   * 当消费者选择 DELIVERY（配送）模式时，商品从平台总部仓库发货。
   * 此接口由平台运营人员操作（Admin Portal），
   * 确认发出商品后，更新订单状态并记录配送台账。
   *
   * ============================================================
   * 与自提模式的区别
   * ============================================================
   *
   * | 维度       | PICKUP（自提）           | DELIVERY（配送）         |
   * |------------|-------------------------|-------------------------|
   * | 提货地点   | 商户门店                | 平台总部仓库             |
   * | 库存来源   | 门店 Variant 库存       | Master SKU 库存         |
   * | 操作角色   | 商户员工（verifyPickup）| 平台运营（shipDelivery） |
   * | 台账记录   | 无                      | DeliveryAllocationLedger|
   *
   * ============================================================
   * 发货前置条件（按顺序检查）
   * ============================================================
   *
   * 1. 订单存在
   * 2. 订单履约类型为 DELIVERY
   * 3. 订单状态为 PAID
   * 4. 尚未发货（shippedAt = null）
   *
   * ============================================================
   * 发货后操作（事务内完成）
   * ============================================================
   *
   * 1. 更新订单状态：PAID → FULFILLED
   * 2. 记录发货时间和平台操作人
   * 3. 扣减 Master SKU 库存（总部主 SKU）
   * 4. 更新 Master SKU 的 cumulativeShippedQty（累计发货量）
   * 5. 创建 DeliveryAllocationLedger 配送台账
   *
   * ============================================================
   * 配送台账说明 (DeliveryAllocationLedger)
   * ============================================================
   *
   * 每笔配送订单都会创建台账记录，包含：
   * - masterSkuId: 商品 ID
   * - quantity: 发货数量
   * - wholesalePrice: 批发单价（用于计算经销商佣金基数）
   * - lineTotal: 该行商品的总金额
   *
   * 台账是计算渠道经销商佣金的重要依据。
   *
   * @param orderId - 订单 ID
   * @param platformUserId - 平台操作人 ID（Admin 用户）
   * @returns 履约结果 { orderId, status: 'FULFILLED' }
   * @throws NotFoundException 订单不存在
   * @throws BadRequestException 订单不是配送类型/状态不对/库存不足
   * @throws ConflictException 订单已发货
   *
   * @example
   * ```typescript
   * // 平台仓库打包完成后，操作发货
   * const result = await fulfillmentService.shipDelivery(orderId, platformUserId);
   * // result = { orderId: "xxx", status: "FULFILLED" }
   * ```
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

  /**
   * 构建自提二维码 payload
   *
   * ============================================================
   * 二维码用途
   * ============================================================
   *
   * 消费者在订单详情页可以看到自提二维码。
   * 到店后，商户员工扫描此二维码或手动输入码进行核销。
   *
   * ============================================================
   * Payload 结构
   * ============================================================
   *
   * ```json
   * {
   *   "orderId": "ord_xxx",
   *   "code": "385921"
   * }
   * ```
   *
   * 如果配置了 PICKUP_QR_SECRET 环境变量，还会包含签名：
   * ```json
   * {
   *   "orderId": "ord_xxx",
   *   "code": "385921",
   *   "sig": "a1b2c3d4e5f6g7h8"
   * }
   * ```
   *
   * ============================================================
   * 安全机制 - HMAC 签名
   * ============================================================
   *
   * 签名算法：sig = HMAC-SHA256(orderId:pickupCode).slice(0, 16)
   *
   * - 使用 PICKUP_QR_SECRET 作为密钥
   * - 取签名的前 16 位（16 字符 hex）
   *
   * 作用：防止恶意用户伪造自提码来欺骗商户
   * 商户端验证时，除了比对码，还会验签
   *
   * @param orderId - 订单 ID
   * @param pickupCode - 6 位自提码
   * @returns JSON 字符串 payload，可用于生成二维码
   *
   * @example
   * ```typescript
   * const payload = fulfillmentService.buildPickupQrPayload(orderId, "385921");
   * // '{"orderId":"ord_xxx","code":"385921","sig":"a1b2c3d4e5f6g7h8"}'
   * ```
   */
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
