import {
  AllocationOrderStatus,
  OnboardingStatus,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PLUGIN_CATALOG_SEED } from '../src/plugins/plugin-catalog.seed';

const prisma = new PrismaClient();

const DEMO_BRANCH_STOCK = 3;
const DEMO_REORDER_THRESHOLD = 5;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function seedTenantInventory(
  tenantId: string,
  stockByVariantId?: Map<string, number>,
) {
  await prisma.tenantInventorySettings.upsert({
    where: { tenantId },
    create: { tenantId, defaultReorderThreshold: DEMO_REORDER_THRESHOLD },
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
    const quantityOnHand =
      stockByVariantId?.get(variant.id) ?? variant.inventory;
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
        quantityOnHand,
      },
      update: { quantityOnHand },
    });
    await prisma.productVariant.update({
      where: { id: variant.id },
      data: { inventory: quantityOnHand },
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

  const crm = await prisma.pluginDefinition.findUnique({
    where: { code: 'crm' },
  });
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

async function upsertApprovedTenant(
  slug: string,
  businessName: string,
  profile: {
    isFlagship: boolean;
    storePublished: boolean;
    contactEmail: string;
  },
) {
  const tenant = await prisma.tenant.upsert({
    where: { slug },
    create: { slug },
    update: {},
  });

  await prisma.merchantProfile.upsert({
    where: { tenantId: tenant.id },
    create: {
      tenantId: tenant.id,
      businessName,
      contactEmail: profile.contactEmail,
      onboardingStatus: OnboardingStatus.APPROVED,
      storePublished: profile.storePublished,
      isFlagship: profile.isFlagship,
    },
    update: {
      businessName,
      contactEmail: profile.contactEmail,
      onboardingStatus: OnboardingStatus.APPROVED,
      storePublished: profile.storePublished,
      isFlagship: profile.isFlagship,
    },
  });

  return tenant;
}

async function syncMasterSkuToFlagshipTenant(
  masterSku: {
    id: string;
    skuCode: string;
    name: string;
    description: string | null;
    shortDescription: string | null;
    flagshipPrice: Prisma.Decimal;
    isActive: boolean;
  },
  flagshipTenantId: string,
) {
  const productSlug = slugify(masterSku.skuCode) || 'starter-widget';

  let variant = await prisma.productVariant.findFirst({
    where: {
      masterSkuId: masterSku.id,
      product: { tenantId: flagshipTenantId },
    },
    include: { product: true },
  });

  if (variant) {
    await prisma.product.update({
      where: { id: variant.productId },
      data: {
        name: masterSku.name,
        description: masterSku.description,
        shortDescription: masterSku.shortDescription,
        isPublished: masterSku.isActive,
      },
    });
    await prisma.productVariant.update({
      where: { id: variant.id },
      data: {
        name: masterSku.name,
        sku: masterSku.skuCode,
        price: masterSku.flagshipPrice,
        isActive: masterSku.isActive,
        inventory: 0,
      },
    });
    return variant;
  }

  const product = await prisma.product.upsert({
    where: {
      tenantId_slug: { tenantId: flagshipTenantId, slug: productSlug },
    },
    create: {
      tenantId: flagshipTenantId,
      name: masterSku.name,
      slug: productSlug,
      description:
        masterSku.description ?? 'A sample product for the demo catalog.',
      shortDescription: masterSku.shortDescription,
      isPublished: masterSku.isActive,
    },
    update: {
      name: masterSku.name,
      description: masterSku.description,
      shortDescription: masterSku.shortDescription,
      isPublished: masterSku.isActive,
    },
  });

  variant = await prisma.productVariant.create({
    data: {
      productId: product.id,
      masterSkuId: masterSku.id,
      sku: masterSku.skuCode,
      name: masterSku.name,
      price: masterSku.flagshipPrice,
      isActive: masterSku.isActive,
      inventory: 0,
    },
    include: { product: true },
  });

  return variant;
}

async function ensureDemoBranchCatalog(
  demoTenantId: string,
  masterSku: {
    id: string;
    skuCode: string;
    name: string;
    description: string | null;
    retailPrice: Prisma.Decimal;
  },
  demoOwnerUserId: string | null,
) {
  const productSlug = slugify(masterSku.skuCode) || 'starter-widget';

  let variant = await prisma.productVariant.findFirst({
    where: { masterSkuId: masterSku.id, product: { tenantId: demoTenantId } },
    include: { product: true },
  });

  if (!variant) {
    const product = await prisma.product.upsert({
      where: {
        tenantId_slug: { tenantId: demoTenantId, slug: productSlug },
      },
      create: {
        tenantId: demoTenantId,
        name: masterSku.name,
        slug: productSlug,
        description:
          masterSku.description ?? 'Branch catalog item synced from HQ.',
        isPublished: true,
      },
      update: {
        name: masterSku.name,
        isPublished: true,
      },
    });

    variant = await prisma.productVariant.create({
      data: {
        productId: product.id,
        masterSkuId: masterSku.id,
        sku: masterSku.skuCode,
        name: masterSku.name,
        price: masterSku.retailPrice,
        isActive: true,
        inventory: DEMO_BRANCH_STOCK,
      },
      include: { product: true },
    });
  }

  const existingAllocation = await prisma.allocationOrder.findFirst({
    where: {
      tenantId: demoTenantId,
      status: AllocationOrderStatus.CONFIRMED,
      lines: { some: { masterSkuId: masterSku.id } },
    },
  });

  if (!existingAllocation) {
    await prisma.allocationOrder.create({
      data: {
        tenantId: demoTenantId,
        status: AllocationOrderStatus.CONFIRMED,
        issuedAt: new Date(),
        confirmedAt: new Date(),
        confirmedByUserId: demoOwnerUserId ?? undefined,
        note: 'Demo seed allocation',
        lines: {
          create: {
            masterSkuId: masterSku.id,
            quantity: 15,
            wholesalePrice: 15,
          },
        },
      },
    });
  }

  const stockMap = new Map([[variant.id, DEMO_BRANCH_STOCK]]);
  await seedTenantInventory(demoTenantId, stockMap);

  return variant;
}

async function seedDemoShowcase() {
  const hqTenant = await upsertApprovedTenant('hq', 'Meridian HQ', {
    isFlagship: true,
    storePublished: false,
    contactEmail: 'hq@meridian.test',
  });

  const demoTenant = await upsertApprovedTenant('demo', 'Demo Store', {
    isFlagship: false,
    storePublished: true,
    contactEmail: 'demo@merchant.test',
  });

  await prisma.merchantProfile.updateMany({
    where: { tenantId: { not: hqTenant.id }, isFlagship: true },
    data: { isFlagship: false },
  });
  await prisma.merchantProfile.update({
    where: { tenantId: hqTenant.id },
    data: { isFlagship: true, storePublished: false },
  });
  await prisma.merchantProfile.update({
    where: { tenantId: demoTenant.id },
    data: { isFlagship: false, storePublished: true },
  });

  const account = await prisma.platformAccount.upsert({
    where: { email: 'demo@merchant.test' },
    update: {},
    create: {
      email: 'demo@merchant.test',
      password: await bcrypt.hash('demo1234', 10),
    },
  });

  const demoUser = await prisma.user.upsert({
    where: {
      tenantId_email: { tenantId: demoTenant.id, email: 'demo@merchant.test' },
    },
    update: { accountId: account.id, role: 'MERCHANT_OWNER' },
    create: {
      tenantId: demoTenant.id,
      accountId: account.id,
      email: 'demo@merchant.test',
      role: 'MERCHANT_OWNER',
    },
  });

  const masterSku = await prisma.masterSku.upsert({
    where: { skuCode: 'DEMO-001' },
    create: {
      skuCode: 'DEMO-001',
      name: 'Starter Widget',
      description: 'A sample product for the demo store.',
      quantityOnHand: 100,
      unitCost: 10,
      wholesalePrice: 15,
      retailPrice: 29.99,
      flagshipPrice: 25,
    },
    update: {
      name: 'Starter Widget',
      description: 'A sample product for the demo store.',
      quantityOnHand: 100,
    },
  });

  await syncMasterSkuToFlagshipTenant(masterSku, hqTenant.id);
  await ensureDemoBranchCatalog(demoTenant.id, masterSku, demoUser.id);

  await prisma.tenantSettings.upsert({
    where: { tenantId: demoTenant.id },
    update: {},
    create: {
      tenantId: demoTenant.id,
      defaultCommissionRate: 10,
      defaultCommissionType: 'PERCENT',
      notifyOnCommission: true,
    },
  });

  const existingAddress = await prisma.procurementReceivingAddress.findFirst({
    where: { tenantId: demoTenant.id, isDefault: true },
  });
  if (!existingAddress) {
    await prisma.procurementReceivingAddress.create({
      data: {
        tenantId: demoTenant.id,
        label: 'Main warehouse',
        contactName: 'Demo Store',
        contactPhone: '13800000000',
        address: '123 Demo Street, Shanghai',
        isDefault: true,
        isActive: true,
      },
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
    {
      email: 'finance@meridian.test',
      password: 'finance123',
      role: 'FINANCE' as const,
    },
    {
      email: 'fulfillment@meridian.test',
      password: 'fulfill123',
      role: 'FULFILLMENT' as const,
    },
    {
      email: 'reviewer@meridian.test',
      password: 'review123',
      role: 'REVIEWER' as const,
    },
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

  const promoterEmail = 'promoter@meridian.test';
  const existingPromoter = await prisma.distributor.findFirst({
    where: { email: promoterEmail },
  });
  if (!existingPromoter) {
    await prisma.distributor.create({
      data: {
        tenantId: null,
        name: 'Demo Promoter',
        email: promoterEmail,
        passwordHash: await bcrypt.hash('promo1234', 10),
        portalEnabled: true,
        commissionRate: 10,
        commissionType: 'PERCENT',
        isActive: true,
      },
    });
  }

  await seedDemoShowcase();
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
