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
    const seeded = await prisma._seedFlagshipCatalog({
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

    await prisma._seedFlagshipCatalog({
      flagshipSlug: 'flagship-hq',
      branchSlug: 'branch-east',
      sku: {
        skuCode: 'hat-200',
        name: 'Summer Hat',
        wholesalePrice: 10,
        retailPrice: 22,
        flagshipPrice: 20,
        branchInventory: 0,
      },
    });

    const category = await prisma.category.create({
      data: {
        tenantId: seeded.flagshipTenant.id,
        name: 'Beverages',
        slug: 'beverages',
      },
    });
    await prisma.product.update({
      where: { id: seeded.flagshipProduct.id },
      data: { category: { connect: { id: category.id } } },
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
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
    const tea = res.body.items.find(
      (item: { slug: string }) => item.slug === 'tea-001',
    );
    expect(tea.variants[0]).toMatchObject({
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
        skuCode: 'scarf-300',
        name: 'Winter Scarf',
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

  it('filters in-stock products only', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/store/catalog?fulfillment=branch-east&inStock=true')
      .expect(200);

    expect(
      res.body.items.every((item: { variants: { inStock: boolean }[] }) =>
        item.variants.some((v) => v.inStock),
      ),
    ).toBe(true);
    expect(
      res.body.items.some((item: { slug: string }) => item.slug === 'hat-200'),
    ).toBe(false);
  });

  it('sorts by price ascending', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/store/catalog?fulfillment=branch-east&sort=price_asc')
      .expect(200);

    const prices = res.body.items.map(
      (item: { variants: { branchPrice: number; flagshipPrice: number }[] }) =>
        Math.min(
          ...item.variants.map((v) => Number(v.branchPrice ?? v.flagshipPrice)),
        ),
    );
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  it('filters by search query', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/store/catalog?fulfillment=branch-east&q=jasmine')
      .expect(200);

    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].slug).toBe('tea-001');
  });

  it('filters by category slug', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/store/catalog?fulfillment=branch-east&category=beverages')
      .expect(200);

    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].slug).toBe('tea-001');
  });

  it('GET /store/catalog/filters returns category counts', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/store/catalog/filters?fulfillment=branch-east')
      .expect(200);

    expect(res.body.categories).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ slug: 'beverages', count: 1 }),
      ]),
    );
  });
});
