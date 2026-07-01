import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, Optional } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  CommissionJobName,
  CommissionAccrueJobPayload,
  DEFAULT_QUEUE_ATTEMPTS,
  DEFAULT_QUEUE_BACKOFF_MS,
  COMMISSION_QUEUE,
} from '@meridian/shared';

/**
 * 佣金队列任务默认配置
 * - attempts: 失败重试次数
 * - backoff: 指数退避策略
 */
const DEFAULT_JOB_OPTIONS = {
  attempts: DEFAULT_QUEUE_ATTEMPTS,
  backoff: { type: 'exponential' as const, delay: DEFAULT_QUEUE_BACKOFF_MS },
};

/**
 * 佣金队列服务 (CommissionQueueService)
 *
 * ========================================
 * 模块职责
 * ========================================
 * 本服务负责将佣金计算任务加入后台队列，实现异步处理。
 *
 * ========================================
 * 队列配置
 * ========================================
 * - 队列名称：COMMISSION_QUEUE（从 @meridian/shared 导入）
 * - Redis 连接：由 BullMQ 管理
 * - 任务名称：ORDER_ACCRUE（订单佣金应计）
 *
 * ========================================
 * 重试机制
 * ========================================
 * - attempts: DEFAULT_QUEUE_ATTEMPTS（失败重试次数）
 * - backoff: 指数退避策略，避免雪崩
 * - delay: DEFAULT_QUEUE_BACKOFF_MS
 *
 * ========================================
 * 降级策略
 * ========================================
 * Redis 不可用时：
 * - @Optional() 使注入不报错
 * - queue 为 undefined
 * - 仅记录日志，不影响主流程
 * - 佣金计算仍在主流程同步完成
 *
 * ========================================
 * 与 CommissionService 的关系
 * ========================================
 * - CommissionService.accrueOnFulfilled() 是同步主流程
 * - enqueueAccrual() 触发异步任务（报表、通知等）
 * - 两者共同完成完整的佣金处理流程
 *
 * @see CommissionService 同步佣金计算
 * @see OrderModule 触发入口
 */
@Injectable()
export class CommissionQueueService {
  private readonly logger = new Logger(CommissionQueueService.name);

  constructor(
    // @Optional() 使 Redis 不可用时不报错
    @Optional()
    @InjectQueue(COMMISSION_QUEUE)
    private readonly queue?: Queue,
  ) {}

  /**
   * 入队佣金计算任务
   *
   * 在订单履约完成后调用，触发后台佣金相关任务的异步处理。
   * 这些后台任务可能包括：
   * - 更新经销商的累计佣金统计
   * - 生成佣金报表数据
   * - 触发达到阈值时的通知
   *
   * ========================================
   * 调用时机
   * ========================================
   * CommissionService.accrueOnFulfilled() 中创建佣金台账后调用。
   *
   * ========================================
   * 错误处理
   * ========================================
   * - 若 Redis 不可用：记录日志，方法正常返回
   * - 若入队失败：BullMQ 自动重试
   *
   * @param orderId - 订单 ID，用于关联后台任务
   * @returns void（异步操作）
   */
  async enqueueAccrual(orderId: string): Promise<void> {
    const payload: CommissionAccrueJobPayload = { orderId };
    if (this.queue) {
      await this.queue.add(
        CommissionJobName.ORDER_ACCRUE,
        payload,
        DEFAULT_JOB_OPTIONS,
      );
      return;
    }
    // Stub 模式：Redis 不可用时仅记录日志
    this.logger.log(
      `[commission queue stub] ${CommissionJobName.ORDER_ACCRUE}: ${JSON.stringify(payload)}`,
    );
  }
}
