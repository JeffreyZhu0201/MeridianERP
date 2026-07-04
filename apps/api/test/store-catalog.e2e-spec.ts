import { INestApplication } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './helpers/create-test-app';
import { MockPrisma } from './helpers/mock-prisma';

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

describe('StoreCatalog (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;
  let merchantToken: string;
  let variantId: string;

  beforeEach(async () => {
    ({ app, prisma } = await createTestApp());
    const password = await bcrypt.hash('secret12', 10);
    const { tenant } = await prisma._seedMerchantOwner(
      'acme-store',
      'Acme Store',
      'owner@acme.test',
      password,
    );
    await prisma.merchantProfile.update({
      where: { tenantId: tenant.id },
      data: { isFlagship: true },
    });
    merchantToken = await loginMerchant(app, 'owner@acme.test', 'secret12');

    const product = await request(app.getHttpServer())
      .post('/api/v1/merchant/products')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        name: 'Blue Widget',
        description: 'A fine widget',
        isPublished: true,
        variants: [
          { sku: 'WIDGET-1', name: 'Default', price: 29.99, inventory: 10 },
        ],
      })
      .expect(201);

    variantId = product.body.variants[0].id;

    await request(app.getHttpServer())
      .post('/api/v1/merchant/products')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        name: 'Draft Gadget',
        isPublished: false,
        variants: [
          { sku: 'GADGET-1', name: 'Default', price: 9.99, inventory: 5 },
        ],
      })
      .expect(201);
  });

  afterEach(async () => {
    await app.close();
  });

  it('lists published products on the public store catalog', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/store/acme-store/products')
      .expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({
      name: 'Blue Widget',
      slug: 'blue-widget',
      isPublished: true,
    });
    expect(res.body[0].variants).toHaveLength(1);
  });

  it('returns product detail by slug', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/store/acme-store/products/blue-widget')
      .expect(200);

    expect(res.body.name).toBe('Blue Widget');
    expect(res.body.variants[0].sku).toBe('WIDGET-1');
  });

  it('returns 404 for unpublished product slug', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/store/acme-store/products/draft-gadget')
      .expect(404);
  });

  it('supports merchant category CRUD', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/merchant/categories')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({ name: 'Widgets' })
      .expect(201);

    expect(created.body.slug).toBe('widgets');

    const list = await request(app.getHttpServer())
      .get('/api/v1/merchant/categories')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    expect(list.body).toHaveLength(1);
  });

  it('exposes variant id for cart tests', () => {
    expect(variantId).toBeDefined();
  });
});
