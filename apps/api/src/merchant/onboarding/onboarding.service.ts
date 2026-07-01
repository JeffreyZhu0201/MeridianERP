import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OnboardingStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { slugify } from '../../common/utils/slug.util';
import { UpdateOnboardingDto } from './dto/update-onboarding.dto';

/**
 * 商户入驻服务 (OnboardingService)
 *
 * 负责商户入驻流程的管理，包括：
 * 1. 获取商户资料（MerchantProfile）
 * 2. 更新商户资料（仅在 DRAFT 或 REJECTED 状态下可编辑）
 * 3. 提交入驻申请（将状态改为 SUBMITTED）
 *
 * 入驻状态流转： DRAFT → SUBMITTED → APPROVED/REJECTED
 */
@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取商户入驻资料
   * @param tenantId 租户ID
   * @returns 商户资料，包含企业名称、联系方式、入驻状态等
   */
  async getProfile(tenantId: string) {
    const profile = await this.prisma.merchantProfile.findUnique({
      where: { tenantId },
    });
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    return profile;
  }

  /**
   * 更新商户入驻资料
   * @param tenantId 租户ID
   * @param dto 更新内容（企业名称、法人名称、联系电话）
   * @returns 更新后的商户资料
   * @throws BadRequestException 仅在 DRAFT 或 REJECTED 状态下可编辑
   */
  async updateProfile(tenantId: string, dto: UpdateOnboardingDto) {
    const profile = await this.getProfile(tenantId);
    if (
      profile.onboardingStatus !== OnboardingStatus.DRAFT &&
      profile.onboardingStatus !== OnboardingStatus.REJECTED
    ) {
      throw new BadRequestException('Profile cannot be edited in current status');
    }
    return this.prisma.merchantProfile.update({
      where: { tenantId },
      data: dto,
    });
  }

  /**
   * 提交入驻申请
   * @param tenantId 租户ID
   * @returns 提交后的商户资料（状态变为 SUBMITTED）
   * @throws BadRequestException 仅草稿状态可以提交
   * @throws BadRequestException 企业名称 slug 已被占用
   */
  async submit(tenantId: string) {
    const profile = await this.getProfile(tenantId);
    if (profile.onboardingStatus !== OnboardingStatus.DRAFT) {
      throw new BadRequestException('Only draft applications can be submitted');
    }
    const slug = slugify(profile.businessName || 'merchant');
    const existingSlug = await this.prisma.tenant.findUnique({
      where: { slug },
    });
    if (existingSlug && existingSlug.id !== tenantId) {
      throw new BadRequestException('Business name slug already taken');
    }
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { slug },
    });
    return this.prisma.merchantProfile.update({
      where: { tenantId },
      data: {
        onboardingStatus: OnboardingStatus.SUBMITTED,
        submittedAt: new Date(),
      },
    });
  }
}
