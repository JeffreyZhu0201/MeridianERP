import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OnboardingStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { slugify } from '../../common/utils/slug.util';
import { UpdateOnboardingDto } from './dto/update-onboarding.dto';

@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(tenantId: string) {
    const profile = await this.prisma.merchantProfile.findUnique({
      where: { tenantId },
    });
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    return profile;
  }

  async updateProfile(tenantId: string, dto: UpdateOnboardingDto) {
    const profile = await this.getProfile(tenantId);
    if (
      profile.onboardingStatus !== OnboardingStatus.DRAFT &&
      profile.onboardingStatus !== OnboardingStatus.REJECTED
    ) {
      throw new BadRequestException(
        'Profile cannot be edited in current status',
      );
    }
    return this.prisma.merchantProfile.update({
      where: { tenantId },
      data: dto,
    });
  }

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
