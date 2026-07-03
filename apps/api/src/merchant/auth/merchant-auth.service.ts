import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { EnvService } from '../../config/env.service';
import { JwtService } from '@nestjs/jwt';
import { MerchantRole, OnboardingStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { draftSlug } from '../../common/utils/slug.util';
import { PlatformAccountsService } from '../../platform/accounts/platform-accounts.service';
import { MerchantLoginDto, MerchantRegisterDto } from './dto/merchant-auth.dto';

@Injectable()
export class MerchantAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly env: EnvService,
    private readonly platformAccounts: PlatformAccountsService,
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
    const existingOwner = await this.prisma.user.findFirst({
      where: { email: dto.email, role: MerchantRole.MERCHANT_OWNER },
    });
    if (existingOwner) {
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

    let account = await this.platformAccounts.findByEmail(dto.email);
    if (account) {
      const valid = await this.platformAccounts.verifyPassword(account, dto.password);
      if (!valid) {
        throw new ConflictException('Email already registered');
      }
      if (await this.platformAccounts.hasMerchantOwnerRole(account.id)) {
        throw new ConflictException('Email already registered as merchant owner');
      }
    } else {
      account = await this.platformAccounts.createAccount({
        email: dto.email,
        password: dto.password,
      });
    }

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
        accountId: account.id,
        email: dto.email,
        role: MerchantRole.MERCHANT_OWNER,
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
        account: true,
        tenant: { include: { merchantProfile: true } },
      },
    });
    if (
      !user ||
      !(await this.platformAccounts.verifyPassword(user.account, dto.password))
    ) {
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
