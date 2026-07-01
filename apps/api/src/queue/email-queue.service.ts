import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, Optional } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  BindingCreatedEmailPayload,
  CommissionAccruedEmailPayload,
  DEFAULT_QUEUE_ATTEMPTS,
  DEFAULT_QUEUE_BACKOFF_MS,
  EmailJobName,
  EMAIL_QUEUE,
} from '@meridian/shared';

/**
 * 邮件队列任务默认配置
 * - attempts: 失败重试次数
 * - backoff: 指数退避策略
 */
const DEFAULT_JOB_OPTIONS = {
  attempts: DEFAULT_QUEUE_ATTEMPTS,
  backoff: { type: 'exponential' as const, delay: DEFAULT_QUEUE_BACKOFF_MS },
};

/**
 * 邮件队列服务 - 入队邮件发送任务
 *
 * 支持的邮件类型：
 * - MERCHANT_WELCOME: 商户注册成功欢迎邮件
 * - MERCHANT_REJECTED: 商户申请被拒绝邮件
 * - DISTRIBUTOR_BINDING_CREATED: 经销商绑定成功邮件
 * - COMMISSION_ACCRUED: 佣金到账通知邮件
 * - ORDER_CONFIRMATION: 订单确认邮件
 *
 * 特性：
 * - Redis 不可用时降级为 stub 模式（仅记录日志）
 * - 自动重试失败的邮件任务
 */
@Injectable()
export class EmailQueueService {
  private readonly logger = new Logger(EmailQueueService.name);

  constructor(
    // @Optional() 使 Redis 不可用时不报错
    @Optional() @InjectQueue(EMAIL_QUEUE) private readonly queue?: Queue,
  ) {}

  /**
   * 发送商户欢迎邮件
   *
   * @param email - 商户邮箱
   * @param businessName - 商户名称
   */
  async sendMerchantWelcome(email: string, businessName: string): Promise<void> {
    await this.enqueue(EmailJobName.MERCHANT_WELCOME, { email, businessName });
  }

  /**
   * 发送商户申请被拒绝邮件
   *
   * @param email - 商户邮箱
   * @param reason - 拒绝原因
   */
  async sendMerchantRejected(email: string, reason: string): Promise<void> {
    await this.enqueue(EmailJobName.MERCHANT_REJECTED, { email, reason });
  }

  /**
   * 发送经销商绑定成功邮件
   *
   * @param payload - 包含 tenantId, distributorId, distributorName 等
   */
  async sendBindingCreated(payload: BindingCreatedEmailPayload): Promise<void> {
    await this.enqueue(EmailJobName.DISTRIBUTOR_BINDING_CREATED, payload);
  }

  /**
   * 发送佣金到账通知邮件
   *
   * @param payload - 包含 tenantId, orderId, distributorId, amount 等
   */
  async sendCommissionAccrued(
    payload: CommissionAccruedEmailPayload,
  ): Promise<void> {
    await this.enqueue(EmailJobName.COMMISSION_ACCRUED, payload);
  }

  /**
   * 发送订单确认邮件
   *
   * @param tenantId - 租户 ID
   * @param orderId - 订单 ID
   * @param email - 客户邮箱
   */
  async sendOrderConfirmation(
    tenantId: string,
    orderId: string,
    email: string,
  ): Promise<void> {
    await this.enqueue(EmailJobName.ORDER_CONFIRMATION, {
      tenantId,
      orderId,
      email,
    });
  }

  /**
   * 入队邮件任务
   *
   * @param name - 任务名称
   * @param payload - 任务数据
   * - 有队列：入队 BullMQ
   * - 无队列：stub 模式，仅记录日志
   */
  private async enqueue(name: string, payload: unknown): Promise<void> {
    if (this.queue) {
      await this.queue.add(name, payload, DEFAULT_JOB_OPTIONS);
      return;
    }
    // Stub 模式：Redis 不可用时仅记录日志
    this.logger.log(`[email queue stub] ${name}: ${JSON.stringify(payload)}`);
  }
}
