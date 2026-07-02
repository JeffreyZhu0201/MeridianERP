import { Injectable } from '@nestjs/common';
import { OnboardingStatus } from '@prisma/client';
import type { PublishedStoreListResponse } from '@meridian/shared';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StoreStoresService {
  
  constructor(private readonly prisma: PrismaService) {}

  
  async listPublished(): Promise<PublishedStoreListResponse> {
    const profiles = await this.prisma.merchantProfile.findMany({
      where: { onboardingStatus: OnboardingStatus.APPROVED },
      include: { tenant: true },
    });
    return {
      items: profiles
        .map((profile) => ({
          slug: profile.tenant.slug,        // 商店 URL 标识
          displayName: profile.businessName, // 商店显示名称
        }))
        .sort((a, b) => a.displayName.localeCompare(b.displayName)),
    };
  }
}
