import { INestApplication } from '@nestjs/common';
import { FulfillmentType, Prisma } from '@prisma/client';
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

const deliveryAddress = {
  name: 'Buyer',
  phone: '13800000000',
  line1: '1 Test St',
  city: 'Shanghai',
};

describe('Merchant delivery orders (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;
  let merchantToken: string;
  let variantId: string;
  const sessionId = 'delivery-session-001';

  beforeEach(async () => {
    ({ app, prisma } = await createTestApp());
    const password = await bcrypt.hash('secret12', 10);
    const { tenant } = await prisma._seedMerchantOwner(
      'branch-store',
      'Branch Store',
      'owner@branch.test',
      password,
      { isFlagship: true },
    );
    merchantToken = await loginMerchant(app, 'owner@branch.test', 'secret12');

    const product = await request(app.getHttpServer())
      .post('/api/v1/merchant/products')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        name: 'Delivery Widget',
        isPublished: true,
        variants: [
          { sku: 'DEL-1', name: 'Default', price: 50, inventory: 8 },
        ],
      })
      .expect(201);

    variantId = product.body.variants[0].id;

    await prisma.merchantProfile.update({
      where: { tenantId: tenant.id },
      data: { isFlagship: false },
    });
  });

  afterEach(async () => {
    await app.close();
  });

  it('lists delivery-pending and ships branch delivery order', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/store/branch-store/cart/items')
      .set('X-Cart-Session', sessionId)
      .send({ variantId, quantity: 2 })
      .expect(201);

    const checkout = await request(app.getHttpServer())
      .post('/api/v1/store/branch-store/checkout')
      .set('X-Cart-Session', sessionId)
      .send({
        guestEmail: 'delivery@branch.test',
        fulfillmentType: 'DELIVERY',
        deliveryAddress,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(
        `/api/v1/store/branch-store/orders/${checkout.body.order.id}/simulate-payment`,
      )
      .expect(200);

    const pending = await request(app.getHttpServer())
      .get('/api/v1/merchant/orders/delivery-pending')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    expect(pending.body).toHaveLength(1);
    expect(pending.body[0].fulfillmentType).toBe('DELIVERY');
    expect(pending.body[0].deliveryAddress).toMatchObject({
      name: 'Buyer',
      city: 'Shanghai',
    });

    await request(app.getHttpServer())
      .post(`/api/v1/merchant/orders/${checkout.body.order.id}/ship`)
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    const order = await request(app.getHttpServer())
      .get(`/api/v1/merchant/orders/${checkout.body.order.id}`)
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    expect(order.body.status).toBe('FULFILLED');
    expect(order.body.shippedAt).toBeTruthy();

    const products = await request(app.getHttpServer())
      .get('/api/v1/merchant/products')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    expect(products.body[0].variants[0].inventory).toBe(6);

    const pendingAfter = await request(app.getHttpServer())
      .get('/api/v1/merchant/orders/delivery-pending')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    expect(pendingAfter.body).toHaveLength(0);
  });

  it('returns empty delivery-pending for flagship merchant', async () => {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: 'branch-store' },
    });
    await prisma.merchantProfile.update({
      where: { tenantId: tenant!.id },
      data: { isFlagship: true },
    });

    const pending = await request(app.getHttpServer())
      .get('/api/v1/merchant/orders/delivery-pending')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    expect(pending.body).toEqual([]);
  });
});
