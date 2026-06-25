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

  async login(dto: DistributorLoginDto) {
    const distributors = await this.prisma.distributor.findMany({
      where: {
        email: dto.email,
        portalEnabled: true,
        isActive: true,
        ...(dto.tenantSlug
          ? { tenant: { slug: dto.tenantSlug } }
          : { tenantId: null }),
      },
      include: { tenant: true },
    });

    if (distributors.length === 0) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!dto.tenantSlug && distributors.length > 1) {
      throw new ForbiddenException(
        'Multiple merchant accounts found — provide tenantSlug',
      );
    }

    const distributor = distributors[0]!;

    if (!distributor.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, distributor.passwordHash);
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
