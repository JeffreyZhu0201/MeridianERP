import { INestApplication } from '@nestjs/common';
import {
  CommissionSource,
  FulfillmentType,
  LedgerStatus,
  OrderStatus,
  Prisma,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { OrderLifecycleService } from '../src/orders/order-lifecycle.service';
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

async function loginPlatform(app: INestApplication<App>) {
  const res = await request(app.getHttpServer())
    .post('/api/v1/platform/auth/login')
    .send({ email: 'admin@meridian.test', password: 'admin123' });
  return res.body.accessToken as string;
}

describe('Store order lifecycle (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;
  let merchantToken: string;
  let customerToken: string;
  let platformToken: string;
  let variantId: string;
  let tenantId: string;

  beforeEach(async () => {
    ({ app, prisma } = await createTestApp());
    const hash = await bcrypt.hash('admin123', 10);
    await prisma._seedPlatformAdmin('admin@meridian.test', hash, 'SUPER_ADMIN');
    platformToken = await loginPlatform(app);

    const password = await bcrypt.hash('secret12', 10);
    const { tenant } = await prisma._seedMerchantOwner(
      'lifecycle-store',
      'Lifecycle Store',
      'owner@lifecycle.test',
      password,
    );
    tenantId = tenant.id;
    merchantToken = await loginMerchant(
      app,
      'owner@lifecycle.test',
      'secret12',
    );

    const product = await request(app.getHttpServer())
      .post('/api/v1/merchant/products')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        name: 'Lifecycle Widget',
        isPublished: true,
        variants: [{ sku: 'LC-1', name: 'Default', price: 40, inventory: 5 }],
      })
      .expect(201);
    variantId = product.body.variants[0].id;

    await prisma.merchantProfile.update({
      where: { tenantId },
      data: { isFlagship: false },
    });

    const register = await request(app.getHttpServer())
      .post('/api/v1/store/lifecycle-store/auth/register')
      .send({ email: 'lifecycle-buyer@example.com', password: 'password12' })
      .expect(201);
    customerToken = register.body.accessToken as string;
  });

  afterEach(async () => {
    await app.close();
  });

  async function checkoutPending(quantity = 1) {
    await request(app.getHttpServer())
      .post('/api/v1/store/lifecycle-store/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ variantId, quantity })
      .expect(201);

    return request(app.getHttpServer())
      .post('/api/v1/store/lifecycle-store/checkout')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ fulfillmentType: 'PICKUP' })
      .expect(201);
  }

  it('cancels a pending payment order for the customer', async () => {
    const checkout = await checkoutPending();
    const orderId = checkout.body.order.id as string;

    const res = await request(app.getHttpServer())
      .post(`/api/v1/store/lifecycle-store/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);

    expect(res.body.status).toBe('CANCELLED');

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    expect(order?.status).toBe(OrderStatus.CANCELLED);
  });

  it('rejects checkout when pending orders reserve inventory', async () => {
    await checkoutPending(5);

    await request(app.getHttpServer())
      .post('/api/v1/store/lifecycle-store/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ variantId, quantity: 1 })
      .expect(400);
  });

  it('expires stale pending orders via lifecycle service', async () => {
    const checkout = await checkoutPending();
    const orderId = checkout.body.order.id as string;

    await prisma.order.update({
      where: { id: orderId },
      data: { createdAt: new Date(Date.now() - 60 * 60 * 1000) },
    });

    const lifecycle = app.get(OrderLifecycleService);
    const expired = await lifecycle.expirePendingOrders(30);
    expect(expired).toBeGreaterThanOrEqual(1);

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    expect(order?.status).toBe(OrderStatus.CANCELLED);
  });

  it('refunds a paid order and voids commission ledger', async () => {
    const checkout = await checkoutPending();
    const orderId = checkout.body.order.id as string;

    await request(app.getHttpServer())
      .post(`/api/v1/store/lifecycle-store/orders/${orderId}/simulate-payment`)
      .expect(200);

    await prisma.commissionLedger.create({
      data: {
        tenantId,
        orderId,
        distributorId: (
          await prisma.distributor.create({
            data: {
              name: 'Dist',
              email: 'dist@test.com',
              commissionRate: 5,
              commissionType: 'PERCENT',
            },
          })
        ).id,
        merchantAllocationSequence: 1,
        commissionSource: CommissionSource.ALLOCATION,
        amount: new Prisma.Decimal(2),
        status: LedgerStatus.ACCRUED,
      },
    });

    const res = await request(app.getHttpServer())
      .post(`/api/v1/platform/orders/${orderId}/refund`)
      .set('Authorization', `Bearer ${platformToken}`)
      .expect(200);

    expect(res.body.status).toBe('REFUNDED');

    const ledger = await prisma.commissionLedger.findUnique({
      where: { orderId },
    });
    expect(ledger?.status).toBe(LedgerStatus.VOID);
  });

  it('blocks store access when merchant is operationally frozen', async () => {
    await prisma.merchantProfile.update({
      where: { tenantId },
      data: { operationalFrozen: true },
    });

    await request(app.getHttpServer())
      .post('/api/v1/store/lifecycle-store/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ variantId, quantity: 1 })
      .expect(403);
  });

  it('lists cross-store orders for account token', async () => {
    const checkout = await checkoutPending();
    const orderId = checkout.body.order.id as string;

    await request(app.getHttpServer())
      .post(`/api/v1/store/lifecycle-store/orders/${orderId}/simulate-payment`)
      .expect(200);

    const accountLogin = await request(app.getHttpServer())
      .post('/api/v1/store/auth/login')
      .send({ email: 'lifecycle-buyer@example.com', password: 'password12' })
      .expect(201);

    const accountToken = accountLogin.body.accessToken as string;

    const res = await request(app.getHttpServer())
      .get('/api/v1/store/account/orders')
      .set('Authorization', `Bearer ${accountToken}`)
      .expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({
      id: orderId,
      storeSlug: 'lifecycle-store',
      status: 'PAID',
    });
  });

  it('applies flat delivery fee from tenant settings', async () => {
    await prisma.tenantSettings.upsert({
      where: { tenantId },
      create: { tenantId, deliveryFlatFee: new Prisma.Decimal(12) },
      update: { deliveryFlatFee: new Prisma.Decimal(12) },
    });

    await request(app.getHttpServer())
      .post('/api/v1/store/lifecycle-store/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ variantId, quantity: 1 })
      .expect(201);

    const checkout = await request(app.getHttpServer())
      .post('/api/v1/store/lifecycle-store/checkout')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        fulfillmentType: 'DELIVERY',
        deliveryAddress: {
          name: 'Buyer',
          phone: '13800000000',
          line1: '1 Test St',
          city: 'Shanghai',
          postalCode: '200000',
        },
      })
      .expect(201);

    expect(Number(checkout.body.order.total)).toBe(52);
  });

  it('confirms delivery on fulfilled delivery orders', async () => {
    const customer = await prisma.customer.findFirst({
      where: { tenantId, email: 'lifecycle-buyer@example.com' },
    });
    expect(customer).toBeTruthy();

    const order = await prisma.order.create({
      data: {
        tenantId,
        customerId: customer!.id,
        status: OrderStatus.FULFILLED,
        fulfillmentType: FulfillmentType.DELIVERY,
        subtotal: new Prisma.Decimal(40),
        tax: new Prisma.Decimal(0),
        total: new Prisma.Decimal(40),
        shippedAt: new Date(),
        deliveryAddress: {
          name: 'Buyer',
          phone: '13800000000',
          line1: '1 Test St',
          city: 'Shanghai',
          postalCode: '200000',
        },
        lines: {
          create: [
            {
              productName: 'Lifecycle Widget',
              variantName: 'Default',
              quantity: 1,
              unitPrice: new Prisma.Decimal(40),
              lineTotal: new Prisma.Decimal(40),
            },
          ],
        },
      },
    });

    const res = await request(app.getHttpServer())
      .post(`/api/v1/store/lifecycle-store/orders/${order.id}/confirm-delivery`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);

    expect(res.body.deliveredAt).toBeTruthy();
  });
});
