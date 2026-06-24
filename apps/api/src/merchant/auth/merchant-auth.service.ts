import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { EnvService } from '../../config/env.service';
import { JwtService } from '@nestjs/jwt';
import { OnboardingStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { draftSlug } from '../../common/utils/slug.util';
import { MerchantLoginDto, MerchantRegisterDto } from './dto/merchant-auth.dto';

@Injectable()
export class MerchantAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly env: EnvService,
  ) {}

  private signMerchantToken(userId: string, tenantId: string, role: string) {
    return this.jwt.sign(
      {
        sub: userId,
        aud: 'merchant' as const,
        tenantId,
        roles: [role],
      },
      { secret: this.env.getOrThrow('JWT_MERCHANT_SECRET') },
    );
  }

  async register(dto: MerchantRegisterDto) {
    const existing = await this.prisma.user.findFirst({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const contactEmail = dto.contactEmail ?? dto.email;

    const tenant = await this.prisma.tenant.create({
      data: { slug: draftSlug() },
    });

    const profile = await this.prisma.merchantProfile.create({
      data: {
        tenantId: tenant.id,
        businessName: dto.businessName,
        legalName: dto.legalName ?? null,
        contactEmail,
        contactPhone: dto.contactPhone ?? null,
        onboardingStatus: OnboardingStatus.DRAFT,
      },
    });

    const user = await this.prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: dto.email,
        password: passwordHash,
        role: 'MERCHANT_OWNER',
      },
    });

    return {
      accessToken: this.signMerchantToken(user.id, tenant.id, user.role),
      onboardingStatus: profile.onboardingStatus,
      tenantId: tenant.id,
    };
  }

  async login(dto: MerchantLoginDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email },
      include: {
        tenant: { include: { merchantProfile: true } },
      },
    });
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const profile = user.tenant.merchantProfile;
    if (!profile || profile.onboardingStatus !== OnboardingStatus.APPROVED) {
      throw new ForbiddenException('Merchant account is not approved');
    }

    return {
      accessToken: this.signMerchantToken(user.id, user.tenantId, user.role),
    };
  }
}
