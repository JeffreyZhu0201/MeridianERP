import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StoreTenantService } from '../common/store-tenant.service';

@Injectable()
export class StoreCatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storeTenant: StoreTenantService,
  ) {}

  async listProducts(slug: string) {
    const { tenant } = await this.storeTenant.resolveApprovedTenant(slug);
    return this.prisma.product.findMany({
      where: { tenantId: tenant.id, isPublished: true },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        variants: { where: { isActive: true }, orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProduct(slug: string, productSlug: string) {
    const { tenant } = await this.storeTenant.resolveApprovedTenant(slug);
    const product = await this.prisma.product.findFirst({
      where: { tenantId: tenant.id, slug: productSlug, isPublished: true },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        variants: { where: { isActive: true }, orderBy: { createdAt: 'asc' } },
      },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }
}
