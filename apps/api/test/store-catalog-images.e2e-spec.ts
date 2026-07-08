import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './helpers/create-test-app';
import { MockPrisma } from './helpers/mock-prisma';
import {
  loginPlatform,
  seedPlatformAdmin,
  uploadTestImage,
} from './helpers/test-media';

describe('Store catalog images (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;
  let platformToken: string;
  let masterSkuId: string;

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
        skuCode: 'store-img-01',
        name: 'Store Image Product',
        wholesalePrice: 15,
        retailPrice: 28,
        flagshipPrice: 25,
        branchInventory: 3,
      },
    });
    masterSkuId = seeded.masterSku.id;
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns primaryImageUrl and images in unified catalog list and detail', async () => {
    const asset = await uploadTestImage(app, platformToken, 'catalog.png');

    await request(app.getHttpServer())
      .patch(`/api/v1/platform/allocations/master-skus/${masterSkuId}`)
      .set('Authorization', `Bearer ${platformToken}`)
      .send({
        description: '**Bold** store copy',
        images: [
          {
            mediaAssetId: asset.id,
            sortOrder: 0,
            altText: 'Catalog hero',
            isPrimary: true,
          },
        ],
      })
      .expect(200);

    const list = await request(app.getHttpServer())
      .get('/api/v1/store/catalog?fulfillment=branch-east')
      .expect(200);

    const item = list.body.items.find(
      (row: { slug: string }) => row.slug === 'store-img-01',
    );
    expect(item).toMatchObject({
      primaryImageUrl: asset.url,
      images: [
        expect.objectContaining({
          url: asset.url,
          altText: 'Catalog hero',
          isPrimary: true,
        }),
      ],
    });

    const detail = await request(app.getHttpServer())
      .get('/api/v1/store/catalog/products/store-img-01?fulfillment=branch-east')
      .expect(200);

    expect(detail.body).toMatchObject({
      slug: 'store-img-01',
      description: '**Bold** store copy',
      primaryImageUrl: asset.url,
      images: [
        expect.objectContaining({
          url: asset.url,
          isPrimary: true,
        }),
      ],
    });
  });
});
