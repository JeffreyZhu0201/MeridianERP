import { Injectable } from '@nestjs/common';
import { EnvService } from '../../config/env.service';
import { PaymentService } from '../../payment/payment.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdatePlatformSettingsDto } from './dto/update-platform-settings.dto';

const SINGLETON_ID = 'singleton';

@Injectable()
export class PlatformSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly env: EnvService,
    private readonly payment: PaymentService,
  ) {}

  private stripeKeyHint(): string | null {
    const key = this.env.get('STRIPE_SECRET_KEY');
    if (!key) return null;
    if (key.length <= 8) return '****';
    return `${key.slice(0, 7)}…${key.slice(-4)}`;
  }

  private webhookUrl(): string {
    const apiUrl =
      this.env.get('API_PUBLIC_URL', 'http://localhost:3001') ??
      'http://localhost:3001';
    return `${apiUrl}/api/v1/store/checkout/webhooks/stripe`;
  }

  private async ensureSettings() {
    return this.prisma.platformSettings.upsert({
      where: { id: SINGLETON_ID },
      create: { id: SINGLETON_ID },
      update: {},
    });
  }

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
