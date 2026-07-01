import { Injectable } from '@nestjs/common';
import { EnvService } from '../../config/env.service';
import { PaymentService } from '../../payment/payment.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdatePlatformSettingsDto } from './dto/update-platform-settings.dto';

/** 平台设置的单例 ID（系统只有一套平台设置） */
const SINGLETON_ID = 'singleton';

/**
 * 平台设置服务 - 管理平台全局配置
 *
 * 功能范围：
 * - 获取平台设置
 * - 更新平台设置
 * - Stripe 集成信息（模式、密钥提示、Webhook URL）
 *
 * 设置项：平台名称、支持邮箱、经销商门户开关、邮件队列开关
 */
@Injectable()
export class PlatformSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly env: EnvService,
    private readonly payment: PaymentService,
  ) {}

  /**
   * 获取 Stripe 密钥提示（脱敏处理）
   *
   * @returns 脱敏后的密钥提示，或 null（未配置）
   */
  private stripeKeyHint(): string | null {
    const key = this.env.get('STRIPE_SECRET_KEY');
    if (!key) return null;
    if (key.length <= 8) return '****';
    return `${key.slice(0, 7)}…${key.slice(-4)}`;
  }

  /**
   * 获取 Stripe Webhook URL
   *
   * 基于 API 公开 URL 构造 Stripe Webhook 端点。
   *
   * @returns Stripe Webhook URL
   */
  private webhookUrl(): string {
    const apiUrl =
      this.env.get('API_PUBLIC_URL', 'http://localhost:3001') ??
      'http://localhost:3001';
    return `${apiUrl}/api/v1/store/checkout/webhooks/stripe`;
  }

  /**
   * 确保平台设置存在（不存在则创建）
   *
   * @returns 平台设置记录
   */
  private async ensureSettings() {
    return this.prisma.platformSettings.upsert({
      where: { id: SINGLETON_ID },
      create: { id: SINGLETON_ID },
      update: {},
    });
  }

  /**
   * 获取平台设置
   *
   * @returns 平台设置（包含 Stripe 集成信息）
   */
  async getSettings() {
    const row = await this.ensureSettings();
    return {
      id: row.id,
      platformName: row.platformName,
      supportEmail: row.supportEmail,
      distributorPortalEnabled: row.distributorPortalEnabled,
      emailQueueEnabled: row.emailQueueEnabled,
      updatedAt: row.updatedAt.toISOString(),
      stripeMode: this.payment.isMockMode() ? ('mock' as const) : ('live' as const),
      stripeKeyHint: this.stripeKeyHint(),
      webhookUrl: this.webhookUrl(),
    };
  }

  /**
   * 更新平台设置
   *
   * @param dto - 更新字段
   * @returns 更新后的平台设置
   */
  async updateSettings(dto: UpdatePlatformSettingsDto) {
    const row = await this.prisma.platformSettings.upsert({
      where: { id: SINGLETON_ID },
      create: {
        id: SINGLETON_ID,
        ...dto,
      },
      update: dto,
    });

    return {
      id: row.id,
      platformName: row.platformName,
      supportEmail: row.supportEmail,
      distributorPortalEnabled: row.distributorPortalEnabled,
      emailQueueEnabled: row.emailQueueEnabled,
      updatedAt: row.updatedAt.toISOString(),
      stripeMode: this.payment.isMockMode() ? ('mock' as const) : ('live' as const),
      stripeKeyHint: this.stripeKeyHint(),
      webhookUrl: this.webhookUrl(),
    };
  }
}
