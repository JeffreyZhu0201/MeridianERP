import { OnboardingStatus, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seedTenantInventory(tenantId: string) {
  await prisma.tenantInventorySettings.upsert({
    where: { tenantId },
    create: { tenantId, defaultReorderThreshold: 5 },
    update: {},
  });

  let warehouse = await prisma.warehouse.findFirst({
    where: { tenantId, isDefault: true },
  });
  if (!warehouse) {
    warehouse = await prisma.warehouse.create({
      data: {
        tenantId,
        name: 'Default Warehouse',
        isDefault: true,
        isActive: true,
      },
    });
  }

  const variants = await prisma.productVariant.findMany({
    where: { product: { tenantId } },
    select: { id: true, inventory: true },
  });

  for (const variant of variants) {
    await prisma.stockLevel.upsert({
      where: {
        warehouseId_variantId: {
          warehouseId: warehouse.id,
          variantId: variant.id,
        },
      },
      create: {
        tenantId,
        warehouseId: warehouse.id,
        variantId: variant.id,
        quantityOnHand: variant.inventory,
      },
      update: {},
    });
  }
}

async function main() {
  await prisma.platformUser.upsert({
    where: { email: 'admin@meridian.test' },
    update: {},
    create: {
      email: 'admin@meridian.test',
      password: await bcrypt.hash('admin123', 10),
      role: 'SUPER_ADMIN',
    },
  });

  const demoSlug = 'demo';
  const existingTenant = await prisma.tenant.findUnique({ where: { slug: demoSlug } });
  if (!existingTenant) {
    const tenant = await prisma.tenant.create({ data: { slug: demoSlug } });
    await prisma.merchantProfile.create({
      data: {
        tenantId: tenant.id,
        businessName: 'Demo Store',
        contactEmail: 'demo@merchant.test',
        onboardingStatus: OnboardingStatus.APPROVED,
      },
    });
    await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: 'demo@merchant.test',
        password: await bcrypt.hash('demo1234', 10),
        role: 'MERCHANT_OWNER',
      },
    });

    const product = await prisma.product.create({
      data: {
        tenantId: tenant.id,
        name: 'Starter Widget',
        slug: 'starter-widget',
        description: 'A sample product for the demo store.',
        isPublished: true,
        variants: {
          create: {
            sku: 'DEMO-001',
            name: 'Default',
            price: 29.99,
            inventory: 100,
          },
        },
      },
      include: { variants: true },
    });

    await seedTenantInventory(tenant.id);
    void product;
  } else {
    await seedTenantInventory(existingTenant.id);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
