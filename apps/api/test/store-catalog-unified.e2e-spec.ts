import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './helpers/create-test-app';
import { MockPrisma } from './helpers/mock-prisma';

describe('Store unified catalog (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;

  beforeEach(async () => {
    ({ app, prisma } = await createTestApp());
    await prisma._seedFlagshipCatalog({
      flagshipSlug: 'flagship-hq',
      branchSlug: 'branch-east',
      sku: {
        skuCode: 'tea-001',
        name: 'Jasmine Tea',
        wholesalePrice: 20,
        retailPrice: 35,
        flagshipPrice: 32,
        branchInventory: 4,
      },
    });
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /store/catalog?fulfillment= returns flagship catalog with branch stock', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/store/catalog?fulfillment=branch-east')
      .expect(200);

    expect(res.body.fulfillmentSlug).toBe('branch-east');
    expect(res.body.flagshipSlug).toBe('flagship-hq');
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].variants[0]).toMatchObject({
      inStock: true,
      inventory: 4,
      branchPrice: expect.anything(),
    });
  });

  it('GET /store/catalog/products/:slug returns unified product detail', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/store/catalog/products/tea-001?fulfillment=branch-east')
      .expect(200);

    expect(res.body.slug).toBe('tea-001');
    expect(res.body.variants[0].branchVariantId).toBeTruthy();
  });

  it('marks products out of stock when branch has no inventory', async () => {
    await prisma._seedFlagshipCatalog({
      flagshipSlug: 'flagship-west',
      branchSlug: 'branch-west',
      sku: {
        skuCode: 'hat-200',
        name: 'Summer Hat',
        wholesalePrice: 10,
        retailPrice: 22,
        flagshipPrice: 20,
        branchInventory: 0,
      },
    });

    const res = await request(app.getHttpServer())
      .get('/api/v1/store/catalog?fulfillment=branch-west')
      .expect(200);

    expect(res.body.items[0].variants[0].inStock).toBe(false);
  });
});
