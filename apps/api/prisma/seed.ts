import { OnboardingStatus, Prisma, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PLUGIN_CATALOG_SEED } from '../src/plugins/plugin-catalog.seed';

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

async function seedPluginCatalog() {
  for (const entry of PLUGIN_CATALOG_SEED) {
    await prisma.pluginDefinition.upsert({
      where: { code: entry.code },
      create: {
        code: entry.code,
        category: entry.category,
        icon: entry.icon,
        sortOrder: entry.sortOrder,
        nameKey: entry.nameKey,
        descriptionKey: entry.descriptionKey,
        navRoutes: entry.navRoutes
          ? (entry.navRoutes as unknown as Prisma.InputJsonValue)
          : undefined,
        isDefaultOnSignup: entry.isDefaultOnSignup,
      },
      update: {
        category: entry.category,
        icon: entry.icon,
        sortOrder: entry.sortOrder,
        nameKey: entry.nameKey,
        descriptionKey: entry.descriptionKey,
        navRoutes: entry.navRoutes
          ? (entry.navRoutes as unknown as Prisma.InputJsonValue)
          : undefined,
        isDefaultOnSignup: entry.isDefaultOnSignup,
      },
    });
  }

  const crm = await prisma.pluginDefinition.findUnique({ where: { code: 'crm' } });
  if (!crm) return;

  const tenants = await prisma.tenant.findMany({ select: { id: true } });
  for (const tenant of tenants) {
    await prisma.tenantPlugin.upsert({
      where: { tenantId_pluginId: { tenantId: tenant.id, pluginId: crm.id } },
      create: { tenantId: tenant.id, pluginId: crm.id, status: 'INSTALLED' },
      update: {},
    });
  }
}

async function main() {
  await seedPluginCatalog();

  await prisma.platformSettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      platformName: 'MeridianERP',
      supportEmail: 'support@meridian.test',
      distributorPortalEnabled: true,
      emailQueueEnabled: true,
    },
  });

  await prisma.platformUser.upsert({
    where: { email: 'admin@meridian.test' },
    update: {},
    create: {
      email: 'admin@meridian.test',
      password: await bcrypt.hash('admin123', 10),
      role: 'SUPER_ADMIN',
    },
  });

  const roleSeeds = [
    { email: 'finance@meridian.test', password: 'finance123', role: 'FINANCE' as const },
    { email: 'fulfillment@meridian.test', password: 'fulfill123', role: 'FULFILLMENT' as const },
    { email: 'reviewer@meridian.test', password: 'review123', role: 'REVIEWER' as const },
  ];
  for (const entry of roleSeeds) {
    await prisma.platformUser.upsert({
      where: { email: entry.email },
      update: { role: entry.role },
      create: {
        email: entry.email,
        password: await bcrypt.hash(entry.password, 10),
        role: entry.role,
      },
    });
  }

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
        storePublished: true,
        isFlagship: true,
      },
    });
    const account = await prisma.platformAccount.upsert({
      where: { email: 'demo@merchant.test' },
      update: {},
      create: {
        email: 'demo@merchant.test',
        password: await bcrypt.hash('demo1234', 10),
      },
    });
    await prisma.user.create({
      data: {
        tenantId: tenant.id,
        accountId: account.id,
        email: 'demo@merchant.test',
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

    await prisma.tenantSettings.upsert({
      where: { tenantId: tenant.id },
      update: {},
      create: {
        tenantId: tenant.id,
        defaultCommissionRate: 10,
        defaultCommissionType: 'PERCENT',
        notifyOnCommission: true,
      },
    });
    void product;
  } else {
    await seedTenantInventory(existingTenant.id);
    await prisma.tenantSettings.upsert({
      where: { tenantId: existingTenant.id },
      update: {},
      create: {
        tenantId: existingTenant.id,
        defaultCommissionRate: 10,
        defaultCommissionType: 'PERCENT',
        notifyOnCommission: true,
      },
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
