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
    await prisma.merchantProfile.update({
      where: { tenantId: tenant.id },
      data: { isFlagship: true },
    });
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

    await request(app.getHttpServer())
      .post('/api/v1/store/acme-store/cart/items')
      .set('X-Cart-Session', sessionId)
      .send({ variantId, quantity: 20 })
      .expect(400);

    const checkout = await request(app.getHttpServer())
      .post('/api/v1/store/acme-store/checkout')
      .set('X-Cart-Session', sessionId)
      .send({ guestEmail: 'guest@example.com', fulfillmentType: 'PICKUP' })
      .expect(201);

    expect(checkout.body.order.status).toBe('PENDING_PAYMENT');
    expect(checkout.body.paymentIntent.id).toContain('pi_mock_');
    expect(checkout.body.mockPayment).toBe(true);

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

  it('does not accrue retail commission after pickup verify when branch has recruiter', async () => {
    const tenant = await prisma.tenant.findUnique({ where: { slug: 'acme-store' } });
    const platformDist = await prisma.distributor.create({
      data: {
        tenantId: null,
        name: 'HQ Channel',
        commissionRate: new Prisma.Decimal(10),
        commissionType: CommissionType.PERCENT,
        isActive: true,
      },
    });
    await prisma.merchantProfile.update({
      where: { tenantId: tenant!.id },
      data: { recruitedByDistributorId: platformDist.id },
    });

    const register = await request(app.getHttpServer())
      .post('/api/v1/store/acme-store/auth/register')
      .send({ email: 'buyer@acme.test', password: 'secret1234' })
      .expect(201);
    const storeToken = register.body.accessToken as string;

    await request(app.getHttpServer())
      .post('/api/v1/store/acme-store/cart/items')
      .set('Authorization', `Bearer ${storeToken}`)
      .send({ variantId, quantity: 1 })
      .expect(201);

    const checkout = await request(app.getHttpServer())
      .post('/api/v1/store/acme-store/checkout')
      .set('Authorization', `Bearer ${storeToken}`)
      .send({ fulfillmentType: 'PICKUP' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/store/acme-store/orders/${checkout.body.order.id}/simulate-payment`)
      .expect(200);

    const paidOrder = await prisma.order.findUnique({
      where: { id: checkout.body.order.id },
      include: { commissionEntry: true },
    });
    expect(paidOrder?.pickupCode).toMatch(/^\d{6}$/);
    expect(paidOrder?.commissionEntry).toBeNull();

    await request(app.getHttpServer())
      .post(`/api/v1/merchant/orders/${checkout.body.order.id}/verify-pickup`)
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({ code: paidOrder!.pickupCode })
      .expect(200);

    const orderDetail = await request(app.getHttpServer())
      .get(`/api/v1/merchant/orders/${checkout.body.order.id}`)
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    expect(orderDetail.body.commissionEntry).toBeNull();
  });

  it('does not accrue retail commission on repeated fulfilled orders', async () => {
    const tenant = await prisma.tenant.findUnique({ where: { slug: 'acme-store' } });
    const platformDist = await prisma.distributor.create({
      data: {
        tenantId: null,
        name: 'HQ Channel',
        commissionRate: new Prisma.Decimal(10),
        commissionType: CommissionType.PERCENT,
        isActive: true,
      },
    });
    await prisma.merchantProfile.update({
      where: { tenantId: tenant!.id },
      data: { recruitedByDistributorId: platformDist.id },
    });

    const register = await request(app.getHttpServer())
      .post('/api/v1/store/acme-store/auth/register')
      .send({ email: 'repeat-buyer@acme.test', password: 'secret1234' })
      .expect(201);
    const storeToken = register.body.accessToken as string;

    async function placeAndFulfillOrder() {
      await request(app.getHttpServer())
        .post('/api/v1/store/acme-store/cart/items')
        .set('Authorization', `Bearer ${storeToken}`)
        .send({ variantId, quantity: 1 })
        .expect(201);

      const checkout = await request(app.getHttpServer())
        .post('/api/v1/store/acme-store/checkout')
        .set('Authorization', `Bearer ${storeToken}`)
        .send({ fulfillmentType: 'PICKUP' })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/api/v1/store/acme-store/orders/${checkout.body.order.id}/simulate-payment`)
        .expect(200);

      const paidOrder = await prisma.order.findUnique({
        where: { id: checkout.body.order.id },
      });

      await request(app.getHttpServer())
        .post(`/api/v1/merchant/orders/${checkout.body.order.id}/verify-pickup`)
        .set('Authorization', `Bearer ${merchantToken}`)
        .send({ code: paidOrder!.pickupCode })
        .expect(200);

      return checkout.body.order.id as string;
    }

    await placeAndFulfillOrder();
    await placeAndFulfillOrder();
    const thirdOrderId = await placeAndFulfillOrder();

    const thirdOrder = await request(app.getHttpServer())
      .get(`/api/v1/merchant/orders/${thirdOrderId}`)
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    expect(thirdOrder.body.commissionEntry).toBeNull();
  });

  it('rejects checkout with empty cart', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/store/acme-store/checkout')
      .set('X-Cart-Session', 'empty-session')
      .send({ guestEmail: 'guest@example.com', fulfillmentType: 'PICKUP' })
      .expect(400);
  });

  it('decrements inventory on pickup verify', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/store/acme-store/cart/items')
      .set('X-Cart-Session', sessionId)
      .send({ variantId, quantity: 3 })
      .expect(201);

    const checkout = await request(app.getHttpServer())
      .post('/api/v1/store/acme-store/checkout')
      .set('X-Cart-Session', sessionId)
      .send({ guestEmail: 'guest@example.com', fulfillmentType: 'PICKUP' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/store/acme-store/orders/${checkout.body.order.id}/simulate-payment`)
      .expect(200);

    const paidOrder = await prisma.order.findUnique({
      where: { id: checkout.body.order.id },
    });

    const productsAfterPay = await request(app.getHttpServer())
      .get('/api/v1/merchant/products')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    expect(productsAfterPay.body[0].variants[0].inventory).toBe(10);

    await request(app.getHttpServer())
      .post(`/api/v1/merchant/orders/${checkout.body.order.id}/verify-pickup`)
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({ code: paidOrder!.pickupCode })
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
      .expect(400);

    const products = await request(app.getHttpServer())
      .get('/api/v1/merchant/products')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    expect(products.body[0].variants[0].inventory).toBe(10);
  });

  it('rejects merchant distributor management (Phase 5)', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/merchant/distributors/${distributorId}/qr`)
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({ bindType: 'CUSTOMER' })
      .expect(403);

    await request(app.getHttpServer())
      .post('/api/v1/merchant/distributors')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({ name: 'Blocked', commissionRate: 5 })
      .expect(403);
  });
});
