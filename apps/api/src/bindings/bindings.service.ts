import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { BindType as PrismaBindType } from '@prisma/client';
import { BindType } from '@meridian/shared';
import type {
  BindVerifyResponse,
  BindingRecord,
} from '@meridian/shared';
import { EnvService } from '../config/env.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailQueueService } from '../queue/email-queue.service';
import { ClaimBindingDto } from './dto/claim-binding.dto';

@Injectable()
export class BindingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly env: EnvService,
    private readonly emailQueue: EmailQueueService,
  ) {}
  async verify(token: string): Promise<BindVerifyResponse> {
    const qr = await this.prisma.distributorQrCode.findUnique({
      where: { token },
      include: { distributor: true },
    });
    if (!qr) {
      return { valid: false, error: 'Token invalid or expired' };
    }
    if (qr.revokedAt) {
      return {
        valid: false,
        error:
          'This link has been replaced. Request a new code from your distributor.',
      };
    }
    if (qr.expiresAt < new Date()) {
      return { valid: false, error: 'Token invalid or expired' };
    }
    try {
      this.jwt.verify(token, {
        secret: this.env.getOrThrow('BIND_TOKEN_SECRET'),
      });
    } catch {
      return { valid: false, error: 'Token signature invalid' };
    }
    let tenantSlug: string | undefined;
    if (qr.bindType === PrismaBindType.CUSTOMER && qr.distributor.tenantId) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: qr.distributor.tenantId },
      });
      tenantSlug = tenant?.slug;
    }
    return {
      valid: true,
      distributorId: qr.distributorId,
      distributorName: qr.distributor.name,
      bindType: qr.bindType as BindType,
      expiresAt: qr.expiresAt.toISOString(),
      requiresAuth: qr.bindType === PrismaBindType.CUSTOMER,
      tenantSlug,
    };
  }
  async claimMerchant(tenantId: string, dto: ClaimBindingDto) {
    const qr = await this.validateBindToken(dto.token);
    if (qr.bindType !== PrismaBindType.MERCHANT) {
      throw new BadRequestException(
        'This link is for customers. Use the store app to bind.',
      );
    }
    if (qr.distributor.tenantId !== tenantId) {
      throw new BadRequestException('Distributor not in your tenant');
    }
    const existing = await this.prisma.binding.findUnique({
      where: {
        bindableType_bindableId: {
          bindableType: PrismaBindType.MERCHANT,
          bindableId: tenantId,
        },
      },
    });
    if (existing) {
      throw new ConflictException('Already bound');
    }
    const binding = await this.prisma.binding.create({
      data: {
        tenantId,
        distributorId: qr.distributorId,
        bindableType: PrismaBindType.MERCHANT,
        bindableId: tenantId,
      },
    });
    await this.prisma.crmLead.create({
      data: {
        tenantId,
        title: `Distributor bind: ${qr.distributorId}`,
        source: 'DISTRIBUTOR_QR',
        distributorId: qr.distributorId,
        stage: 'NEW',
      },
    });
    await this.notifyBindingCreatedIfEnabled(
      tenantId,
      qr.distributorId,
      binding.bindableType,
      binding.boundAt,
    );

    return this.formatBinding(binding);
  }

  private async validateBindToken(token: string) {
    const qr = await this.prisma.distributorQrCode.findUnique({
      where: { token },
      include: { distributor: true },
    });
    if (!qr) {
      throw new BadRequestException('Token invalid or expired');
    }
    if (qr.revokedAt) {
      throw new BadRequestException(
        'This link has been replaced. Request a new code from your distributor.',
      );
    }
    if (qr.expiresAt < new Date()) {
      throw new BadRequestException('Token invalid or expired');
    }
    try {
      this.jwt.verify(token, {
        secret: this.env.getOrThrow('BIND_TOKEN_SECRET'),
      });
    } catch {
      throw new BadRequestException('Token signature invalid');
    }

    return qr;
  }

  private async notifyBindingCreatedIfEnabled(
    tenantId: string,
    distributorId: string,
    bindType: PrismaBindType,
    boundAt: Date,
  ): Promise<void> {
    const settings = await this.prisma.tenantSettings.findUnique({
      where: { tenantId },
    });
    if (settings?.notifyOnBinding === false) {
      return;
    }
    await this.emailQueue.sendBindingCreated({
      tenantId,
      distributorId,
      bindType,
      boundAt: boundAt.toISOString(),
    });
  }

  private formatBinding(binding: {
    id: string;
    tenantId: string;
    distributorId: string;
    bindableType: PrismaBindType;
    bindableId: string;
    boundAt: Date;
  }): BindingRecord {
    return {
      id: binding.id,
      tenantId: binding.tenantId,
      distributorId: binding.distributorId,
      bindableType: binding.bindableType as BindType,
      bindableId: binding.bindableId,
      boundAt: binding.boundAt.toISOString(),
    };
  }
}
