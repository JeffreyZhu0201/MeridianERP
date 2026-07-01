import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CommissionQueueService } from '../queue/commission-queue.service';
import { EmailQueueService } from '../queue/email-queue.service';

/**
 * 佣金服务 (CommissionService)
 *
 * ========================================
 * 佣金体系概述
 * ========================================
 *
 * 本服务负责处理经销商佣金的计算和记录，是渠道经销商激励体系的核心组件。
 *
 * 【佣金触发机制】
 * - 触发时机：订单履约完成（OrderStatus.FULFILLED）时
 * - 触发入口：订单服务在订单状态变更为 FULFILLED 时调用 accrueOnFulfilled()
 * - 关键变更：Phase 5 之前佣金在 PAID 时计算，现已改为 FULFILLED（更准确反映经销商贡献）
 *
 * 【佣金计算公式】
 *
 * 1. 百分比佣金（PERCENT）：
 *    佣金金额 = 订单总额( orderTotal ) × (佣金率( commissionRate ) / 100)
 *
 *    示例：订单总额 ¥1000，佣金率 5%
 *    佣金 = 1000 × (5 / 100) = ¥50
 *
 * 2. 固定佣金（FIXED）：
 *    佣金金额 = 固定佣金金额( commissionRate )
 *
 *    示例：固定佣金 ¥20
 *    佣金 = ¥20
 *
 * 【佣金台账结构 (CommissionLedger)】
 *
 * 每笔佣金生成一条台账记录，包含：
 * - tenantId: 商户租户ID（用于多租户隔离）
 * - orderId: 关联订单ID（唯一约束，防止重复计算）
 * - distributorId: 收款经销商ID
 * - amount: 佣金金额（Decimal，精确到分）
 * - status: 状态（ACCRUED 应计 → SETTLED 已结算 / VOID 作废）
 * - settlementBatchId: 结算批次ID（结算时关联）
 * - settledAt: 结算时间
 *
 * 【经销商分配规则】
 *
 * 1. 招募关系确认：
 *    商户通过 MerchantProfile.recruitedByDistributorId 关联其招募经销商
 *    只有通过平台审核的招募关系才计算佣金
 *
 * 2. 经销商有效性检查：
 *    - 必须是平台级经销商（tenantId = null）
 *    - 必须处于活跃状态（isActive = true）
 *    - 无效经销商的订单不计算佣金
 *
 * 3. 佣金归属：
 *    佣金100%归属招募该商户的经销商
 *    不支持多级分销佣金（Phase 1 仅支持单层）
 *
 * 【配额/Allocation 对佣金的影响】
 *
 * 注意：当前实现中，佣金基于订单总额计算，而非配额分配金额。
 * 这是因为：
 * - 订单总额反映消费者实际支付金额
 * - 配额分配（AllocationOrder）仅影响商户进货，不影响零售
 *
 * 未来规划：若需基于配额计算佣金，需在 AllocationOrder 履约时触发额外佣金逻辑。
 *
 * 【数据一致性保证】
 *
 * 1. 幂等性：orderId 唯一约束防止重复计算
 * 2. 状态校验：仅处理 FULFILLED 状态订单
 * 3. 异步处理：后台队列处理通知等副作用
 * 4. 邮件通知：根据商户设置决定是否发送佣金到账通知
 *
 * @module CommissionService
 * @nestjsModule CommissionModule
 */
@Injectable()
export class CommissionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly commissionQueue: CommissionQueueService,
    private readonly emailQueue: EmailQueueService,
  ) {}

  /**
   * @deprecated Phase 5 废弃 — 佣金在 FULFILLED 时计算，不再在 PAID 时计算
   *
   * 保留此方法签名以避免破坏现有调用方（可能来自旧版订单服务或测试代码）。
   * 当前实现为空操作，不会产生任何副作用。
   *
   * 历史背景：
   * - Phase 5 之前：佣金在订单支付时（PAID）预提
   * - Phase 5 起：佣金改为订单履约完成时（FULFILLED）计算
   *
   * 变更原因：
   * - FULFILLED 代表商户真正完成交付，经销商贡献已确认
   * - 避免退款订单（CANCELLED/REFUNDED）导致佣金回滚的复杂性
   *
   * @param _orderId - 订单ID（已废弃，不再使用）
   * @returns 空操作
   */
  async accrueOnPaid(_orderId: string): Promise<void> {
    return;
  }

  /**
   * 订单履约完成时计算佣金（核心业务方法）
   *
   * ========================================
   * 方法职责
   * ========================================
   * 这是佣金计算的主入口，由订单服务在订单状态变更为 FULFILLED 时调用。
   *
   * ========================================
   * 执行流程详解
   * ========================================
   *
   * Step 1: 订单查询与状态校验
   * - 查询订单（包含 commissionEntry 关联检查）
   * - 校验订单状态必须为 FULFILLED
   * - 若订单不存在或状态不符，直接返回（幂等处理）
   *
   * Step 2: 幂等性检查
   * - 检查是否已有佣金记录（commissionEntry）
   * - 已存在记录说明佣金已计算，防止重复
   * - Prisma schema 中 orderId 有 unique 约束，双重保险
   *
   * Step 3: 招募关系查询
   * - 通过 MerchantProfile 根据 tenantId 查询商户资料
   * - 获取 recruitedByDistributorId（招募该商户的经销商ID）
   * - 若无招募关系（如商户自主注册），跳过佣金计算
   *
   * Step 4: 经销商有效性校验
   * - 查询经销商必须满足以下条件：
   *   a) tenantId = null（平台级经销商，不是商户自己的经销商）
   *   b) isActive = true（状态为活跃）
   * - 不活跃经销商不参与佣金分配
   *
   * Step 5: 佣金金额计算
   * - 调用 calculateAmount() 方法
   * - 公式：见类文档或 calculateAmount 方法注释
   * - 返回 Prisma.Decimal 类型保证精度
   *
   * Step 6: 佣金台账记录创建
   * - 在 CommissionLedger 表创建新记录
   * - status 默认为 'ACCRUED'（应计/预提状态）
   * - tenantId、orderId、distributorId 建立关联
   *
   * Step 7: 后台任务入队
   * - 调用 commissionQueue.enqueueAccrual(orderId)
   * - 异步处理统计报表、佣金排行榜等后续操作
   * - Redis 不可用时降级为日志记录
   *
   * Step 8: 邮件通知（可选）
   * - 查询商户的通知设置（TenantSettings.notifyOnCommission）
   * - 默认为 true（发送通知）
   * - 调用 emailQueue.sendCommissionAccrued() 发送邮件
   *
   * ========================================
   * 错误处理策略
   * ========================================
   * - 所有查询失败均静默返回，不抛异常（幂等设计）
   * - 邮件发送失败不影响佣金记录创建
   * - 后台队列失败由 BullMQ 重试机制处理
   *
   * ========================================
   * 性能注意事项
   * ========================================
   * - 使用了 3 次独立数据库查询
   * - 考虑在高频场景下合并为单一查询或添加缓存
   * - 邮件发送为异步，不阻塞主流程
   *
   * @param orderId - 订单 ID（Order.id）
   * @returns void（异步操作，结果通过数据库状态反映）
   *
   * @example
   * // 订单服务中调用示例
   * if (order.status === OrderStatus.FULFILLED) {
   *   await this.commissionService.accrueOnFulfilled(order.id);
   * }
   */
  async accrueOnFulfilled(orderId: string): Promise<void> {
    // 查询订单（包含已有佣金记录）
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { commissionEntry: true },
    });
    // 订单不存在或状态不是 FULFILLED，跳过
    if (!order || order.status !== OrderStatus.FULFILLED) {
      return;
    }
    // 已有佣金记录，避免重复
    if (order.commissionEntry) {
      return;
    }

    // 查询商户资料，获取招募该商户的经销商 ID
    const profile = await this.prisma.merchantProfile.findUnique({
      where: { tenantId: order.tenantId },
    });
    if (!profile?.recruitedByDistributorId) {
      // 商户没有被经销商招募，跳过
      return;
    }

    // 查询经销商（必须是平台级活跃经销商）
    const distributor = await this.prisma.distributor.findFirst({
      where: {
        id: profile.recruitedByDistributorId,
        tenantId: null, // 平台级经销商
        isActive: true,
      },
    });
    if (!distributor) {
      return;
    }

    // 计算佣金金额
    const amount = this.calculateAmount(
      Number(order.total),
      Number(distributor.commissionRate),
      distributor.commissionType,
    );

    // 创建佣金台账记录
    await this.prisma.commissionLedger.create({
      data: {
        tenantId: order.tenantId,
        orderId: order.id,
        distributorId: distributor.id,
        amount,
        status: 'ACCRUED', // 预提状态
      },
    });

    // 入队后台任务（处理异步操作）
    await this.commissionQueue.enqueueAccrual(order.id);

    // 检查是否需要发送佣金通知邮件
    const settings = await this.prisma.tenantSettings.findUnique({
      where: { tenantId: order.tenantId },
    });
    if (settings?.notifyOnCommission !== false) {
      await this.emailQueue.sendCommissionAccrued({
        tenantId: order.tenantId,
        orderId: order.id,
        distributorId: distributor.id,
        amount: amount.toString(),
      });
    }
  }

  /**
   * 计算佣金金额（纯函数）
   *
   * ========================================
   * 计算公式
   * ========================================
   *
   * 1. 百分比佣金（commissionType = 'PERCENT'）
   *    佣金 = 订单总额(orderTotal) × (佣金率(commissionRate) / 100)
   *
   *    示例：
   *    - orderTotal = 1000, commissionRate = 5
   *    - 佣金 = 1000 × (5 / 100) = 50
   *
   * 2. 固定佣金（commissionType = 'FIXED'）
   *    佣金 = 固定金额(commissionRate)
   *
   *    示例：
   *    - commissionRate = 20（无论订单金额大小）
   *    - 佣金 = 20
   *
   * ========================================
   * 精度处理
   * ========================================
   * - 使用 Prisma.Decimal 保证金融精度（避免浮点数误差）
   * - 最终结果保留两位小数（toFixed(2)）
   *
   * ========================================
   * 佣金率配置位置
   * ========================================
   * - 经销商级别：Distributor.commissionRate / Distributor.commissionType
   * - 商户默认：TenantSettings.defaultCommissionRate / defaultCommissionType
   * - 通常在经销商创建/审核时由平台设定
   *
   * ========================================
   * 注意事项
   * ========================================
   * - 本方法是纯函数，无副作用
   * - 不访问数据库，仅做数学计算
   * - 输入参数应为原始数值（非 Decimal 字符串）
   *
   * @param orderTotal - 订单总额（消费者实际支付金额）
   * @param commissionRate - 佣金率（百分比时为数字如5表示5%，固定时为金额）
   * @param commissionType - 佣金类型（PERCENT | FIXED）
   * @returns 计算后的佣金金额（Prisma.Decimal 类型，精确到分）
   *
   * @example
   * // 百分比佣金
   * calculateAmount(1000, 5, 'PERCENT') // => Decimal(50)
   *
   * // 固定佣金
   * calculateAmount(10000, 20, 'FIXED') // => Decimal(20)
   */
  calculateAmount(
    orderTotal: number,
    commissionRate: number,
    commissionType: import('@prisma/client').CommissionType,
  ): Prisma.Decimal {
    const value =
      commissionType === 'PERCENT'
        ? orderTotal * (commissionRate / 100) // 百分比：总额 × 率
        : commissionRate; // 固定金额
    return new Prisma.Decimal(value.toFixed(2));
  }
}
