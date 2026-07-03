import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { EnvService } from '../../config/env.service';
import { PrismaService } from '../../prisma/prisma.service';
import { DistributorLoginDto } from './dto/distributor-login.dto';

@Injectable()
export class DistributorAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly env: EnvService,
  ) {}

  private signDistributorToken(distributorId: string, tenantId: string | null) {
    return this.jwt.sign(
      {
        sub: distributorId,
        aud: 'distributor' as const,
        tenantId: tenantId ?? undefined,
        roles: ['DISTRIBUTOR'],
      },
      { secret: this.env.getOrThrow('JWT_DISTRIBUTOR_SECRET') },
    );
  }

  private async findLoginDistributor(dto: DistributorLoginDto) {
    if (dto.tenantSlug) {
      return this.prisma.distributor.findFirst({
        where: {
          email: dto.email,
          portalEnabled: true,
          isActive: true,
          tenant: { slug: dto.tenantSlug },
        },
        include: {
          tenant: true,
          account: { select: { password: true } },
        },
      });
    }

    const byEmail = await this.prisma.distributor.findFirst({
      where: {
        email: dto.email,
        portalEnabled: true,
        isActive: true,
        tenantId: null,
      },
      include: {
        tenant: true,
        account: { select: { password: true } },
      },
    });
    if (byEmail) {
      return byEmail;
    }

    return this.prisma.distributor.findFirst({
      where: {
        portalEnabled: true,
        isActive: true,
        tenantId: null,
        account: { email: dto.email },
      },
      include: {
        tenant: true,
        account: { select: { password: true } },
      },
    });
  }

  async login(dto: DistributorLoginDto) {
    if (!dto.tenantSlug) {
      const matches = await this.prisma.distributor.findMany({
        where: {
          portalEnabled: true,
          isActive: true,
          tenantId: null,
          OR: [{ email: dto.email }, { account: { email: dto.email } }],
        },
        select: { id: true },
      });
      if (matches.length > 1) {
        throw new ForbiddenException(
          'Multiple merchant accounts found — provide tenantSlug',
        );
      }
    }

    const distributor = await this.findLoginDistributor(dto);
    if (!distributor) {
      throw new UnauthorizedException('Invalid credentials');
    }

    let valid = false;
    if (distributor.passwordHash) {
      valid = await bcrypt.compare(dto.password, distributor.passwordHash);
    }
    if (!valid && distributor.accountId && distributor.account?.password) {
      valid = await bcrypt.compare(dto.password, distributor.account.password);
      if (valid) {
        await this.prisma.distributor.update({
          where: { id: distributor.id },
          data: { passwordHash: distributor.account.password },
        });
      }
    }
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.distributor.update({
      where: { id: distributor.id },
      data: { lastLoginAt: new Date() },
    });
    return {
      accessToken: this.signDistributorToken(distributor.id, distributor.tenantId),
      distributor: {
        id: distributor.id,
        name: distributor.name,
        email: distributor.email!,
        tenantSlug: distributor.tenant?.slug ?? null,
        isPlatformDistributor: distributor.tenantId === null,
      },
    };
  }
}
