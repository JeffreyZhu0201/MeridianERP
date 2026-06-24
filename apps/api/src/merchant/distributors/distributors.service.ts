import { Injectable, NotFoundException } from '@nestjs/common';
import { EnvService } from '../../config/env.service';
import { JwtService } from '@nestjs/jwt';
import { BindType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateDistributorDto,
  UpdateDistributorDto,
} from './dto/distributor.dto';

@Injectable()
export class DistributorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly env: EnvService,
  ) {}

  findAll(tenantId: string) {
    return this.prisma.distributor.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const distributor = await this.prisma.distributor.findFirst({
      where: { id, tenantId },
      include: { qrCodes: { orderBy: { createdAt: 'desc' }, take: 5 } },
    });
    if (!distributor) {
      throw new NotFoundException('Distributor not found');
    }
    return distributor;
  }

  create(tenantId: string, dto: CreateDistributorDto) {
    return this.prisma.distributor.create({
      data: {
        tenantId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        commissionRate: dto.commissionRate,
        commissionType: dto.commissionType ?? 'PERCENT',
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateDistributorDto) {
    await this.findOne(tenantId, id);
    return this.prisma.distributor.update({
      where: { id },
      data: dto,
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    await this.prisma.distributor.delete({ where: { id } });
    return { deleted: true };
  }

  async generateQr(
    tenantId: string,
    id: string,
    bindType: BindType = BindType.MERCHANT,
  ) {
    const distributor = await this.findOne(tenantId, id);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const token = this.jwt.sign(
      {
        distributorId: distributor.id,
        tenantId,
        bindType,
        purpose: 'bind',
      },
      {
        secret: this.env.getOrThrow('BIND_TOKEN_SECRET'),
        expiresIn: '7d',
      },
    );
    await this.prisma.distributorQrCode.create({
      data: {
        distributorId: distributor.id,
        token,
        bindType,
        expiresAt,
      },
    });
    const merchantAppUrl =
      this.env.get('MERCHANT_APP_URL', 'http://localhost:3002');
    return { token, url: `${merchantAppUrl}/bind/${token}` };
  }
}
