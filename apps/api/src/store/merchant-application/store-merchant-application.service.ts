import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MerchantRole, OnboardingStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PlatformAccountsService } from '../../platform/accounts/platform-accounts.service';
import { RecruitInviteService } from '../../recruit-invite/recruit-invite.service';
import { draftSlug, slugify } from '../../common/utils/slug.util';
import { StoreMerchantApplicationDto } from './dto/store-merchant-application.dto';

@Injectable()
export class StoreMerchantApplicationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly platformAccounts: PlatformAccountsService,
    private readonly recruitInvite: RecruitInviteService,
  ) {}

  previewInvite(code: string) {
    return this.recruitInvite.previewInviteCode(code);
  }

  async getMyApplication(accountId: string) {
    const owner = await this.prisma.user.findFirst({
      where: { accountId, role: MerchantRole.MERCHANT_OWNER },
      include: { tenant: { include: { merchantProfile: true } } },
    });
    if (!owner?.tenant.merchantProfile) {
      return null;
    }
    const profile = owner.tenant.merchantProfile;
    return {
      id: profile.id,
      businessName: profile.businessName,
      onboardingStatus: profile.onboardingStatus,
      submittedAt: profile.submittedAt?.toISOString() ?? null,
      pendingRecruitInviteCode: profile.pendingRecruitInviteCode,
    };
  }

  async submit(accountId: string, dto: StoreMerchantApplicationDto) {
    const account = await this.platformAccounts.findById(accountId);
    if (!account) {
      throw new NotFoundException('Account not found');
    }
    if (await this.platformAccounts.hasMerchantOwnerRole(accountId)) {
      throw new ConflictException('Account already has a merchant application');
    }

    const existingDraft = await this.prisma.user.findFirst({
      where: {
        accountId,
        role: MerchantRole.MERCHANT_OWNER,
        tenant: {
          merchantProfile: {
            onboardingStatus: {
              in: [
                OnboardingStatus.DRAFT,
                OnboardingStatus.SUBMITTED,
                OnboardingStatus.UNDER_REVIEW,
              ],
            },
          },
        },
      },
    });
    if (existingDraft) {
      throw new ConflictException('Merchant application already in progress');
    }

    const invite = dto.inviteCode?.trim()
      ? await this.recruitInvite.validateMerchantRecruitCode(dto.inviteCode)
      : null;

    const tenant = await this.prisma.tenant.create({
      data: { slug: draftSlug() },
    });

    const profile = await this.prisma.merchantProfile.create({
      data: {
        tenantId: tenant.id,
        businessName: dto.businessName.trim(),
        legalName: dto.legalName?.trim() || null,
        contactEmail: account.email,
        contactPhone: dto.contactPhone?.trim() || account.phone || null,
        onboardingStatus: OnboardingStatus.DRAFT,
        pendingRecruitInviteCode: invite?.code ?? null,
      },
    });

    await this.prisma.user.create({
      data: {
        tenantId: tenant.id,
        accountId: account.id,
        email: account.email,
        role: MerchantRole.MERCHANT_OWNER,
      },
    });

    const slug = slugify(profile.businessName || 'merchant');
    const existingSlug = await this.prisma.tenant.findUnique({
      where: { slug },
    });
    if (existingSlug && existingSlug.id !== tenant.id) {
      throw new BadRequestException('Business name slug already taken');
    }

    await this.prisma.tenant.update({
      where: { id: tenant.id },
      data: { slug },
    });

    const submitted = await this.prisma.merchantProfile.update({
      where: { tenantId: tenant.id },
      data: {
        onboardingStatus: OnboardingStatus.SUBMITTED,
        submittedAt: new Date(),
      },
    });

    return {
      id: submitted.id,
      businessName: submitted.businessName,
      onboardingStatus: submitted.onboardingStatus,
      submittedAt: submitted.submittedAt?.toISOString() ?? null,
      pendingRecruitInviteCode: submitted.pendingRecruitInviteCode,
    };
  }
}
