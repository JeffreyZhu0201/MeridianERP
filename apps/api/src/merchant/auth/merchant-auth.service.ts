import {
  BadRequestException,
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

/**
 * 商户认证服务 (MerchantAuthService)
 *
 * 负责商户用户的注册、登录和 JWT Token 签发。
 *
 * 业务逻辑：
 * 1. 注册时创建商户租户（Tenant）和商户资料（MerchantProfile），状态为 DRAFT（草稿）
 * 2. 支持邀请码注册（通过 distributor 招募链接）
 * 3. 登录时验证邮箱密码，账户状态必须为 APPROVED 才能登录
 * 4. 所有 Token 使用 JWT_MERCHANT_SECRET 签发，受众为 'merchant'
 */
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

    let pendingRecruitInviteCode: string | null = null;
    if (dto.inviteCode) {
      const invite = await this.prisma.merchantRecruitInviteCode.findFirst({
        where: {
          code: dto.inviteCode.toUpperCase(),
          revokedAt: null,
        },
        include: { distributor: true },
      });
      if (!invite) {
        throw new BadRequestException('Invalid invite code');
      }
      if (invite.expiresAt && invite.expiresAt < new Date()) {
        throw new BadRequestException('Invite code has expired');
      }
      if (!invite.distributor.isActive || invite.distributor.tenantId !== null) {
        throw new BadRequestException('Invite code is not valid for branch registration');
      }
      pendingRecruitInviteCode = invite.code;
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
        pendingRecruitInviteCode,
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
