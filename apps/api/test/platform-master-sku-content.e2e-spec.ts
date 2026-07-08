import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './helpers/create-test-app';
import {
  loginPlatform,
  seedPlatformAdmin,
  uploadTestImage,
} from './helpers/test-media';

describe('Platform master SKU content (e2e)', () => {
  let app: INestApplication<App>;
  let platformToken: string;

  beforeEach(async () => {
    const setup = await createTestApp();
    app = setup.app;
    await seedPlatformAdmin(setup.prisma);
    await setup.prisma._seedFlagshipCatalog({
      flagshipSlug: 'flagship-hq',
      branchSlug: 'branch-east',
      sku: {
        skuCode: 'SEED-001',
        name: 'Seed SKU',
        wholesalePrice: 10,
        retailPrice: 20,
        flagshipPrice: 18,
      },
    });
    platformToken = await loginPlatform(app);
  });

  afterEach(async () => {
    await app.close();
  });

  it('PATCH master-skus/:id persists description and images; GET returns detail', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/platform/allocations/master-skus')
      .set('Authorization', `Bearer ${platformToken}`)
      .send({
        skuCode: 'MEDIA-001',
        name: 'Media Product',
        quantityOnHand: 10,
        unitCost: 5,
        wholesalePrice: 12,
        retailPrice: 20,
        flagshipPrice: 18,
      })
      .expect(201);

    const asset = await uploadTestImage(app, platformToken, 'hero.png');

    await request(app.getHttpServer())
      .patch(`/api/v1/platform/allocations/master-skus/${created.body.id}`)
      .set('Authorization', `Bearer ${platformToken}`)
      .send({
        description: '## Highlights\n\n- Fresh roast\n- Free shipping',
        shortDescription: 'Premium media SKU',
        images: [
          {
            mediaAssetId: asset.id,
            sortOrder: 0,
            altText: 'Hero shot',
            isPrimary: true,
          },
        ],
      })
      .expect(200);

    const detail = await request(app.getHttpServer())
      .get(`/api/v1/platform/allocations/master-skus/${created.body.id}`)
      .set('Authorization', `Bearer ${platformToken}`)
      .expect(200);

    expect(detail.body).toMatchObject({
      description: '## Highlights\n\n- Fresh roast\n- Free shipping',
      shortDescription: 'Premium media SKU',
      images: [
        expect.objectContaining({
          mediaAssetId: asset.id,
          url: asset.url,
          altText: 'Hero shot',
          isPrimary: true,
        }),
      ],
    });
  });
});
