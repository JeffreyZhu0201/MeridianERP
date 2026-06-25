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

describe('StoreOrders (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;
  let merchantToken: string;
  let customerToken: string;
  let variantId: string;

  beforeEach(async () => {
    ({ app, prisma } = await createTestApp());
    const password = await bcrypt.hash('secret12', 10);
    await prisma._seedMerchantOwner('acme-store', 'Acme Store', 'owner@acme.test', password);
    merchantToken = await loginMerchant(app, 'owner@acme.test', 'secret12');

    const product = await request(app.getHttpServer())
      .post('/api/v1/merchant/products')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        name: 'Widget',
        isPublished: true,
        variants: [{ sku: 'W-1', name: 'Default', price: 25, inventory: 20 }],
      })
      .expect(201);
    variantId = product.body.variants[0].id;

    const register = await request(app.getHttpServer())
      .post('/api/v1/store/acme-store/auth/register')
      .send({ email: 'buyer@example.com', password: 'password12' })
      .expect(201);
    customerToken = register.body.accessToken as string;

    await request(app.getHttpServer())
      .post('/api/v1/store/acme-store/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ variantId, quantity: 1 })
      .expect(201);

    const checkout = await request(app.getHttpServer())
      .post('/api/v1/store/acme-store/checkout')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({})
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/store/acme-store/orders/${checkout.body.order.id}/simulate-payment`)
      .expect(200);
  });

  afterEach(async () => {
    await app.close();
  });

  it('lists orders for authenticated customer', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/store/acme-store/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({
      status: 'PAID',
      lineCount: 1,
    });
    expect(res.body[0].total).toBeDefined();
  });

  it('returns order detail for owner', async () => {
    const list = await request(app.getHttpServer())
      .get('/api/v1/store/acme-store/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);

    const orderId = list.body[0].id as string;

    const detail = await request(app.getHttpServer())
      .get(`/api/v1/store/acme-store/orders/${orderId}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);

    expect(detail.body.id).toBe(orderId);
    expect(detail.body.lines).toHaveLength(1);
    expect(detail.body.lines[0].productName).toBe('Widget');
  });

  it('rejects unauthenticated list', async () => {
    await request(app.getHttpServer()).get('/api/v1/store/acme-store/orders').expect(401);
  });

  it('returns 404 for unknown order id', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/store/acme-store/orders/ord_missing')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(404);
  });

  it('does not expose another customer order', async () => {
    const other = await request(app.getHttpServer())
      .post('/api/v1/store/acme-store/auth/register')
      .send({ email: 'other@example.com', password: 'password12' })
      .expect(201);

    const list = await request(app.getHttpServer())
      .get('/api/v1/store/acme-store/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/api/v1/store/acme-store/orders/${list.body[0].id}`)
      .set('Authorization', `Bearer ${other.body.accessToken}`)
      .expect(404);
  });
});
