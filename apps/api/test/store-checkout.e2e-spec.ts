import { INestApplication } from '@nestjs/common';
import { CommissionType } from '@prisma/client';
import { Prisma } from '@prisma/client';
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

describe('StoreCheckout (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;
  let merchantToken: string;
  let variantId: string;
  let distributorId: string;
  const sessionId = 'guest-session-001';

  beforeEach(async () => {
    ({ app, prisma } = await createTestApp());
    const password = await bcrypt.hash('secret12', 10);
    const { tenant } = await prisma._seedMerchantOwner(
      'acme-store',
      'Acme Store',
      'owner@acme.test',
      password,
    );
    merchantToken = await loginMerchant(app, 'owner@acme.test', 'secret12');

    const distributor = await prisma.distributor.create({
      data: {
        tenantId: tenant.id,
        name: 'Partner One',
        commissionRate: new Prisma.Decimal(10),
        commissionType: CommissionType.PERCENT,
      },
    });
    distributorId = distributor.id;

    const product = await request(app.getHttpServer())
      .post('/api/v1/merchant/products')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        name: 'Blue Widget',
        isPublished: true,
        variants: [{ sku: 'WIDGET-1', name: 'Default', price: 50, inventory: 10 }],
      })
      .expect(201);

    variantId = product.body.variants[0].id;
  });

  afterEach(async () => {
    await app.close();
  });

  it('guest checkout flow with mock payment and commission', async () => {
    const cart = await request(app.getHttpServer())
      .post('/api/v1/store/acme-store/cart/items')
      .set('X-Cart-Session', sessionId)
      .send({ variantId, quantity: 2 })
      .expect(201);

    expect(cart.body.itemCount).toBe(2);
    expect(cart.body.subtotal).toBe(100);

    const checkout = await request(app.getHttpServer())
      .post('/api/v1/store/acme-store/checkout')
      .set('X-Cart-Session', sessionId)
      .send({ guestEmail: 'guest@example.com' })
      .expect(201);

    expect(checkout.body.order.status).toBe('PENDING_PAYMENT');
    expect(checkout.body.paymentIntent.id).toContain('pi_mock_');

    await request(app.getHttpServer())
      .post(`/api/v1/store/acme-store/orders/${checkout.body.order.id}/simulate-payment`)
      .expect(200);

    const merchantOrders = await request(app.getHttpServer())
      .get('/api/v1/merchant/orders')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    expect(merchantOrders.body).toHaveLength(1);
    expect(merchantOrders.body[0].status).toBe('PAID');
    expect(merchantOrders.body[0].guestEmail).toBe('guest@example.com');
  });

  it('accrues commission when cart has distributor', async () => {
    const tenant = await prisma.tenant.findUnique({ where: { slug: 'acme-store' } });
    await prisma.cart.create({
      data: {
        tenantId: tenant!.id,
        sessionId,
        distributorId,
      },
    });

    await request(app.getHttpServer())
      .post('/api/v1/store/acme-store/cart/items')
      .set('X-Cart-Session', sessionId)
      .send({ variantId, quantity: 1 })
      .expect(201);

    const checkout = await request(app.getHttpServer())
      .post('/api/v1/store/acme-store/checkout')
      .set('X-Cart-Session', sessionId)
      .send({ guestEmail: 'guest@example.com' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/store/acme-store/orders/${checkout.body.order.id}/simulate-payment`)
      .expect(200);

    const orderDetail = await request(app.getHttpServer())
      .get(`/api/v1/merchant/orders/${checkout.body.order.id}`)
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    expect(orderDetail.body.commissionEntry).toMatchObject({
      distributorId,
      status: 'ACCRUED',
    });
    expect(Number(orderDetail.body.commissionEntry.amount)).toBe(5);
  });

  it('rejects checkout with empty cart', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/store/acme-store/checkout')
      .set('X-Cart-Session', 'empty-session')
      .send({ guestEmail: 'guest@example.com' })
      .expect(400);
  });

  it('decrements inventory on paid order', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/store/acme-store/cart/items')
      .set('X-Cart-Session', sessionId)
      .send({ variantId, quantity: 3 })
      .expect(201);

    const checkout = await request(app.getHttpServer())
      .post('/api/v1/store/acme-store/checkout')
      .set('X-Cart-Session', sessionId)
      .send({ guestEmail: 'guest@example.com' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/store/acme-store/orders/${checkout.body.order.id}/simulate-payment`)
      .expect(200);

    const products = await request(app.getHttpServer())
      .get('/api/v1/merchant/products')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    expect(products.body[0].variants[0].inventory).toBe(7);

    const stockLevels = await request(app.getHttpServer())
      .get('/api/v1/merchant/inventory/stock-levels')
      .set('Authorization', `Bearer ${merchantToken}`)
      .query({ variantId })
      .expect(200);

    expect(stockLevels.body.data[0].quantityOnHand).toBe(7);
  });

  it('rejects checkout when quantity exceeds sellable stock (US-3.8)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/store/acme-store/cart/items')
      .set('X-Cart-Session', sessionId)
      .send({ variantId, quantity: 11 })
      .expect(201);

    const checkout = await request(app.getHttpServer())
      .post('/api/v1/store/acme-store/checkout')
      .set('X-Cart-Session', sessionId)
      .send({ guestEmail: 'guest@example.com' })
      .expect(400);

    expect(checkout.body.message).toMatch(/insufficient inventory/i);

    const products = await request(app.getHttpServer())
      .get('/api/v1/merchant/products')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    expect(products.body[0].variants[0].inventory).toBe(10);
  });
});
