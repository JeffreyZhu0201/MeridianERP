import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { BindType } from '@prisma/client';
import { EnvService } from '../config/env.service';
import { PrismaService } from '../prisma/prisma.service';
import { ClaimBindingDto } from './dto/claim-binding.dto';

interface BindTokenPayload {
  distributorId: string;
  tenantId: string;
  bindType: BindType;
  purpose: string;
}

@Injectable()
export class BindingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly env: EnvService,
  ) {}

  async verify(token: string) {
    const qr = await this.prisma.distributorQrCode.findUnique({
      where: { token },
      include: { distributor: true },
    });
    if (!qr || qr.expiresAt < new Date()) {
      throw new NotFoundException('Token invalid or expired');
    }
    try {
      this.jwt.verify(token, {
        secret: this.env.getOrThrow('BIND_TOKEN_SECRET'),
      });
    } catch {
      throw new BadRequestException('Token signature invalid');
    }
    return {
      valid: true,
      distributorId: qr.distributorId,
      bindType: qr.bindType,
      expiresAt: qr.expiresAt,
    };
  }

  async claim(tenantId: string, dto: ClaimBindingDto) {
    const verification = await this.verify(dto.token);
    const distributor = await this.prisma.distributor.findFirst({
      where: { id: verification.distributorId, tenantId },
    });
    if (!distributor) {
      throw new BadRequestException('Distributor not in your tenant');
    }

    const existing = await this.prisma.binding.findUnique({
      where: {
        bindableType_bindableId: {
          bindableType: verification.bindType,
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
        distributorId: verification.distributorId,
        bindableType: verification.bindType,
        bindableId: tenantId,
      },
    });

    await this.prisma.crmLead.create({
      data: {
        tenantId,
        title: `Distributor bind: ${verification.distributorId}`,
        source: 'DISTRIBUTOR_QR',
        distributorId: verification.distributorId,
        stage: 'NEW',
      },
    });

    return binding;
  }
}
