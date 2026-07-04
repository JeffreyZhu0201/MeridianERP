import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './helpers/create-test-app';
import { MockPrisma } from './helpers/mock-prisma';

describe('Store per-store catalog filters (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;

  beforeEach(async () => {
    ({ app, prisma } = await createTestApp());
    const tenant = await prisma._seedApprovedTenant('demo-store', 'Demo Store');

    const category = await prisma.category.create({
      data: {
        tenantId: tenant.id,
        name: 'Accessories',
        slug: 'accessories',
      },
    });

    await prisma.product.create({
      data: {
        tenantId: tenant.id,
        name: 'Blue Cap',
        slug: 'blue-cap',
        isPublished: true,
        categoryId: category.id,
        variants: {
          create: [
            {
              sku: 'CAP-1',
              name: 'Blue Cap',
              price: 15,
              inventory: 3,
              isActive: true,
            },
          ],
        },
      },
    });

    await prisma.product.create({
      data: {
        tenantId: tenant.id,
        name: 'Red Scarf',
        slug: 'red-scarf',
        isPublished: true,
        variants: {
          create: [
            {
              sku: 'SCF-1',
              name: 'Red Scarf',
              price: 25,
              inventory: 0,
              isActive: true,
            },
          ],
        },
      },
    });
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /store/:slug/products/filters returns categories', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/store/demo-store/products/filters')
      .expect(200);

    expect(res.body.categories).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ slug: 'accessories', count: 1 }),
      ]),
    );
  });

  it('GET /store/:slug/products?inStock=true excludes zero inventory', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/store/demo-store/products?inStock=true')
      .expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].slug).toBe('blue-cap');
  });

  it('GET /store/:slug/products?sort=price_desc orders by price', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/store/demo-store/products?sort=price_desc')
      .expect(200);

    expect(res.body[0].slug).toBe('red-scarf');
    expect(res.body[1].slug).toBe('blue-cap');
  });

  it('GET /store/:slug/products?q= filters by name', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/store/demo-store/products?q=scarf')
      .expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].slug).toBe('red-scarf');
  });
});
