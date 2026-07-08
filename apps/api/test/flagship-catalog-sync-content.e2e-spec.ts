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

describe('Flagship catalog content sync (e2e)', () => {
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
        skuCode: 'SYNC-IMG',
        name: 'Sync Image Tea',
        wholesalePrice: 20,
        retailPrice: 35,
        flagshipPrice: 32,
        branchInventory: 6,
      },
    });
    masterSkuId = seeded.masterSku.id;
  });

  afterEach(async () => {
    await app.close();
  });

  it('syncs description and images to flagship product after master SKU update', async () => {
    const asset = await uploadTestImage(app, platformToken);

    await request(app.getHttpServer())
      .patch(`/api/v1/platform/allocations/master-skus/${masterSkuId}`)
      .set('Authorization', `Bearer ${platformToken}`)
      .send({
        description: 'Synced flagship description',
        shortDescription: 'Synced summary',
        images: [
          {
            mediaAssetId: asset.id,
            sortOrder: 0,
            altText: 'Packaging',
            isPrimary: true,
          },
        ],
      })
      .expect(200);

    const catalog = await request(app.getHttpServer())
      .get('/api/v1/platform/flagship-catalog')
      .set('Authorization', `Bearer ${platformToken}`)
      .expect(200);

    const row = catalog.body.find(
      (item: { skuCode: string }) => item.skuCode === 'SYNC-IMG',
    );
    expect(row).toMatchObject({
      synced: true,
      description: 'Synced flagship description',
      shortDescription: 'Synced summary',
      primaryImageUrl: asset.url,
      images: [
        expect.objectContaining({
          url: asset.url,
          altText: 'Packaging',
          isPrimary: true,
        }),
      ],
    });
  });
});
