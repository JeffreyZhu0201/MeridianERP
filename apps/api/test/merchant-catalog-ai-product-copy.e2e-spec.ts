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

describe('Merchant catalog AI product copy (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;
  let merchantToken: string;
  let productId: string;

  beforeEach(async () => {
    ({ app, prisma } = await createTestApp());
    const password = await bcrypt.hash('secret12', 10);
    const { tenant } = await prisma._seedMerchantOwner(
      'copy-ai-store',
      'Copy AI Store',
      'owner@copy-ai.test',
      password,
    );
    merchantToken = await loginMerchant(app, 'owner@copy-ai.test', 'secret12');

    const product = await request(app.getHttpServer())
      .post('/api/v1/merchant/products')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        name: 'Premium Tea Set',
        description: 'Handcrafted ceramic tea set.',
        isPublished: true,
        variants: [
          { sku: 'TEA-1', name: 'Default', price: 128, inventory: 5 },
        ],
      })
      .expect(201);

    productId = product.body.id;
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns product copy for an existing product', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/merchant/catalog/ai/product-copy')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({ productId })
      .expect(201);

    expect(res.body.title).toEqual(expect.any(String));
    expect(res.body.description).toEqual(expect.any(String));
    expect(res.body.sources.length).toBeGreaterThan(0);
    expect(res.body.title).toMatch(/Premium Tea Set|茶/);
  });

  it('returns product copy from draft fields', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/merchant/catalog/ai/product-copy')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({ draft: { name: 'Draft Gadget', price: 99 } })
      .expect(201);

    expect(res.body.title).toEqual(expect.any(String));
    expect(res.body.description).toEqual(expect.any(String));
    expect(res.body.title).toMatch(/Draft Gadget|Gadget/);
  });

  it('returns 404 for another tenant product', async () => {
    const password = await bcrypt.hash('secret12', 10);
    const { tenant: otherTenant } = await prisma._seedMerchantOwner(
      'other-copy-store',
      'Other Copy Store',
      'owner@other-copy.test',
      password,
    );
    const otherToken = await loginMerchant(
      app,
      'owner@other-copy.test',
      'secret12',
    );

    const otherProduct = await request(app.getHttpServer())
      .post('/api/v1/merchant/products')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({
        name: 'Other Product',
        variants: [{ sku: 'OTH-1', name: 'Default', price: 10, inventory: 1 }],
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/merchant/catalog/ai/product-copy')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({ productId: otherProduct.body.id })
      .expect(404);
  });

  it('returns 400 when draft has no name or sku', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/merchant/catalog/ai/product-copy')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({ draft: { description: 'only desc' } })
      .expect(400);
  });
});
