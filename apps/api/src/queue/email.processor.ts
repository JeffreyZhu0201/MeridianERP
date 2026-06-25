import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  EmailJobName,
  type BindingCreatedEmailPayload,
  type CommissionAccruedEmailPayload,
  type MerchantRejectedEmailPayload,
  type MerchantWelcomeEmailPayload,
  type OrderConfirmationEmailPayload,
  EMAIL_QUEUE,
} from '@meridian/shared';
import { PrismaService } from '../prisma/prisma.service';
import { ConsoleMailTransport } from './console-mail.transport';

@Processor(EMAIL_QUEUE)
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);
  private readonly mail = new ConsoleMailTransport();

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case EmailJobName.MERCHANT_WELCOME:
        return this.handleMerchantWelcome(
          job.data as MerchantWelcomeEmailPayload,
        );
      case EmailJobName.MERCHANT_REJECTED:
        return this.handleMerchantRejected(
          job.data as MerchantRejectedEmailPayload,
        );
      case EmailJobName.DISTRIBUTOR_BINDING_CREATED:
        return this.handleBindingCreated(
          job.data as BindingCreatedEmailPayload,
        );
      case EmailJobName.COMMISSION_ACCRUED:
        return this.handleCommissionAccrued(
          job.data as CommissionAccruedEmailPayload,
        );
      case EmailJobName.ORDER_CONFIRMATION:
        return this.handleOrderConfirmation(
          job.data as OrderConfirmationEmailPayload,
        );
      default:
        this.logger.warn(`Unknown email job: ${job.name}`);
    }
  }

  private handleMerchantWelcome(payload: MerchantWelcomeEmailPayload): void {
    this.mail.send(payload.email, 'Welcome to MeridianERP', {
      template: EmailJobName.MERCHANT_WELCOME,
      businessName: payload.businessName,
    });
  }

  private handleMerchantRejected(payload: MerchantRejectedEmailPayload): void {
    this.mail.send(payload.email, 'Merchant application update', {
      template: EmailJobName.MERCHANT_REJECTED,
      reason: payload.reason,
    });
  }

  private async handleBindingCreated(
    payload: BindingCreatedEmailPayload,
  ): Promise<void> {
    const recipient = await this.resolveMerchantOwnerEmail(payload.tenantId);
    if (!recipient) {
      this.logger.warn(
        `No merchant owner email for binding notification tenant=${payload.tenantId}`,
      );
      return;
    }

    const distributor = await this.prisma.distributor.findFirst({
      where: { id: payload.distributorId, tenantId: payload.tenantId },
      select: { name: true },
    });

    this.mail.send(recipient, 'New distributor binding', {
      template: EmailJobName.DISTRIBUTOR_BINDING_CREATED,
      distributorId: payload.distributorId,
      distributorName: distributor?.name,
      bindType: payload.bindType,
      boundAt: payload.boundAt,
    });
  }

  private async handleCommissionAccrued(
    payload: CommissionAccruedEmailPayload,
  ): Promise<void> {
    const recipient = await this.resolveMerchantOwnerEmail(payload.tenantId);
    if (!recipient) {
      this.logger.warn(
        `No merchant owner email for commission notification tenant=${payload.tenantId}`,
      );
      return;
    }

    this.mail.send(recipient, 'Commission accrued', {
      template: EmailJobName.COMMISSION_ACCRUED,
      orderId: payload.orderId,
      distributorId: payload.distributorId,
      amount: payload.amount,
    });
  }

  private handleOrderConfirmation(
    payload: OrderConfirmationEmailPayload,
  ): void {
    this.mail.send(payload.email, 'Order confirmation', {
      template: EmailJobName.ORDER_CONFIRMATION,
      orderId: payload.orderId,
      tenantId: payload.tenantId,
    });
  }

  private async resolveMerchantOwnerEmail(
    tenantId: string,
  ): Promise<string | null> {
    const profile = await this.prisma.merchantProfile.findUnique({
      where: { tenantId },
      select: { contactEmail: true },
    });
    return profile?.contactEmail ?? null;
  }
}
