import { INestApplication } from '@nestjs/common';
import { MerchantRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './helpers/create-test-app';
import { MockPrisma } from './helpers/mock-prisma';
import {
  loginPlatform,
  seedPlatformAdmin,
  uploadTestImage,
} from './helpers/test-media';

async function loginMerchant(
  app: INestApplication<App>,
  email: string,
  password: string,
) {
  const res = await request(app.getHttpServer())
    .post('/api/v1/merchant/auth/login')
    .send({ email, password });
  return res.body.accessToken as string;
}

describe('Allocation confirm content sync (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;
  let platformToken: string;
  let merchantToken: string;
  let branchTenantId: string;
  let masterSkuId: string;
  let branchVariantId: string;

  beforeEach(async () => {
    const setup = await createTestApp();
    app = setup.app;
    prisma = setup.prisma;
    await seedPlatformAdmin(prisma);
    platformToken = await loginPlatform(app);

    const seeded = await prisma._seedFlagshipCatalog({
      flagshipSlug: 'flagship-hq',
      branchSlug: 'branch-east',
      sku: {
        skuCode: 'ALLOC-CONTENT',
        name: 'Allocation Content Tea',
        wholesalePrice: 20,
        retailPrice: 35,
        flagshipPrice: 32,
        branchInventory: 0,
      },
    });
    masterSkuId = seeded.masterSku.id;
    branchTenantId = seeded.branchTenant.id;
    branchVariantId = seeded.branchVariant.id;

    const password = await bcrypt.hash('secret12', 10);
    await prisma.user.create({
      data: {
        tenantId: branchTenantId,
        email: 'owner@branch.test',
        password,
        role: MerchantRole.MERCHANT_OWNER,
      },
    });
    merchantToken = await loginMerchant(app, 'owner@branch.test', 'secret12');
  });

  afterEach(async () => {
    await app.close();
  });

  it('copies description and images when merchant confirms a new allocation', async () => {
    const asset = await uploadTestImage(app, platformToken);

    await request(app.getHttpServer())
      .patch(`/api/v1/platform/allocations/master-skus/${masterSkuId}`)
      .set('Authorization', `Bearer ${platformToken}`)
      .send({
        description: 'Branch allocation description',
        shortDescription: 'Branch summary',
        images: [
          {
            mediaAssetId: asset.id,
            sortOrder: 0,
            altText: 'Branch pack',
            isPrimary: true,
          },
        ],
      })
      .expect(200);

    const created = await request(app.getHttpServer())
      .post('/api/v1/platform/allocations')
      .set('Authorization', `Bearer ${platformToken}`)
      .send({
        tenantId: branchTenantId,
        lines: [{ masterSkuId, quantity: 3 }],
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/platform/allocations/${created.body.id}/issue`)
      .set('Authorization', `Bearer ${platformToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/v1/merchant/allocations/${created.body.id}/confirm`)
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    const variant = await prisma.productVariant.findFirst({
      where: { id: branchVariantId },
    });
    const product = await prisma.product.findFirst({
      where: { id: variant?.productId },
      include: { images: true },
    });

    expect(product).toMatchObject({
      description: 'Branch allocation description',
      shortDescription: 'Branch summary',
    });
    expect(product?.images).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          url: asset.url,
          altText: 'Branch pack',
          isPrimary: true,
        }),
      ]),
    );
  });

  it('refreshes content on re-confirm when branch product already exists', async () => {
    const firstAsset = await uploadTestImage(app, platformToken, 'first.png');
    const secondAsset = await uploadTestImage(app, platformToken, 'second.png');

    await prisma.product.update({
      where: {
        id: (
          await prisma.productVariant.findFirst({
            where: { id: branchVariantId },
          })
        )!.productId,
      },
      data: {
        description: 'Stale branch description',
        shortDescription: 'Stale summary',
      },
    });

    await request(app.getHttpServer())
      .patch(`/api/v1/platform/allocations/master-skus/${masterSkuId}`)
      .set('Authorization', `Bearer ${platformToken}`)
      .send({
        description: 'Updated HQ description',
        shortDescription: 'Updated summary',
        images: [
          {
            mediaAssetId: secondAsset.id,
            sortOrder: 0,
            altText: 'Updated pack',
            isPrimary: true,
          },
        ],
      })
      .expect(200);

    const created = await request(app.getHttpServer())
      .post('/api/v1/platform/allocations')
      .set('Authorization', `Bearer ${platformToken}`)
      .send({
        tenantId: branchTenantId,
        lines: [{ masterSkuId, quantity: 1 }],
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/platform/allocations/${created.body.id}/issue`)
      .set('Authorization', `Bearer ${platformToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/v1/merchant/allocations/${created.body.id}/confirm`)
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    const variant = await prisma.productVariant.findFirst({
      where: { id: branchVariantId },
    });
    const product = await prisma.product.findFirst({
      where: { id: variant?.productId },
      include: { images: true },
    });

    expect(product).toMatchObject({
      description: 'Updated HQ description',
      shortDescription: 'Updated summary',
    });
    expect(product?.images).toEqual([
      expect.objectContaining({
        url: secondAsset.url,
        altText: 'Updated pack',
        isPrimary: true,
      }),
    ]);
    expect(product?.images).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ url: firstAsset.url }),
      ]),
    );
  });
});
