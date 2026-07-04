import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OnboardingStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StoreTenantService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveApprovedTenant(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug } });
    if (!tenant) {
      throw new NotFoundException('Store not found');
    }
    const profile = await this.prisma.merchantProfile.findUnique({
      where: { tenantId: tenant.id },
    });
    if (!profile || profile.onboardingStatus !== OnboardingStatus.APPROVED) {
      throw new ForbiddenException('Store is not available');
    }

    return { tenant, profile };
  }
}
