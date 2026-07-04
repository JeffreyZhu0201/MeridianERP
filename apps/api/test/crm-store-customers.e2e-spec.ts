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

async function seedStoreWithProduct(app: INestApplication<App>, prisma: MockPrisma) {
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
  const merchantToken = await loginMerchant(app, 'owner@acme.test', 'secret12');

  await request(app.getHttpServer())
    .post('/api/v1/merchant/plugins/crm/install')
    .set('Authorization', `Bearer ${merchantToken}`)
    .expect(201);

  const product = await request(app.getHttpServer())
    .post('/api/v1/merchant/products')
    .set('Authorization', `Bearer ${merchantToken}`)
    .send({
      name: 'Blue Widget',
      isPublished: true,
      variants: [{ sku: 'WIDGET-1', name: 'Default', price: 50, inventory: 10 }],
    })
    .expect(201);

  return {
    tenant,
    merchantToken,
    variantId: product.body.variants[0].id as string,
  };
}

async function registerStoreCustomer(
  app: INestApplication<App>,
  email: string,
) {
  const register = await request(app.getHttpServer())
    .post('/api/v1/store/acme-store/auth/register')
    .send({ email, password: 'secret1234' })
    .expect(201);
  return register.body.accessToken as string;
}

async function placePickupOrder(
  app: INestApplication<App>,
  storeToken: string,
  variantId: string,
  fulfill: boolean,
  merchantToken: string,
  prisma: MockPrisma,
) {
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
    .post(
      `/api/v1/store/acme-store/orders/${checkout.body.order.id}/simulate-payment`,
    )
    .expect(200);

  if (fulfill) {
    const paidOrder = await prisma.order.findUnique({
      where: { id: checkout.body.order.id },
    });
    await request(app.getHttpServer())
      .post(`/api/v1/merchant/orders/${checkout.body.order.id}/verify-pickup`)
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({ code: paidOrder!.pickupCode })
      .expect(200);
  }

  return checkout.body.order.id as string;
}

describe('CRM store customers (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;

  beforeEach(async () => {
    ({ app, prisma } = await createTestApp());
  }, 15000);

  afterEach(async () => {
    await app.close();
  });

  it('lists customers with fulfilled orders only', async () => {
    const { merchantToken, variantId } = await seedStoreWithProduct(app, prisma);

    const fulfilledToken = await registerStoreCustomer(app, 'fulfilled@acme.test');
    await placePickupOrder(
      app,
      fulfilledToken,
      variantId,
      true,
      merchantToken,
      prisma,
    );

    const paidOnlyToken = await registerStoreCustomer(app, 'paid-only@acme.test');
    await placePickupOrder(
      app,
      paidOnlyToken,
      variantId,
      false,
      merchantToken,
      prisma,
    );

    const res = await request(app.getHttpServer())
      .get('/api/v1/merchant/crm/store-customers')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].email).toBe('fulfilled@acme.test');
    expect(res.body[0].completedOrderCount).toBeGreaterThanOrEqual(1);
    expect(Number(res.body[0].totalSpent)).toBeGreaterThan(0);
    expect(res.body[0].lastOrderAt).toBeTruthy();
  });

  it('enforces tenant isolation', async () => {
    const { merchantToken, variantId } = await seedStoreWithProduct(app, prisma);
    const storeToken = await registerStoreCustomer(app, 'buyer@acme.test');
    await placePickupOrder(
      app,
      storeToken,
      variantId,
      true,
      merchantToken,
      prisma,
    );

    const password = await bcrypt.hash('secret12', 10);
    await prisma._seedMerchantOwner(
      'other-store',
      'Other Store',
      'owner@other.test',
      password,
    );
    const otherToken = await loginMerchant(app, 'owner@other.test', 'secret12');

    await request(app.getHttpServer())
      .post('/api/v1/merchant/plugins/crm/install')
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(201);

    const res = await request(app.getHttpServer())
      .get('/api/v1/merchant/crm/store-customers')
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(200);

    expect(res.body).toHaveLength(0);
  });

  it('returns 403 when CRM plugin is not installed', async () => {
    const { merchantToken, variantId } = await seedStoreWithProduct(app, prisma);

    const storeToken = await registerStoreCustomer(app, 'buyer@acme.test');
    await placePickupOrder(
      app,
      storeToken,
      variantId,
      true,
      merchantToken,
      prisma,
    );

    await request(app.getHttpServer())
      .delete('/api/v1/merchant/plugins/crm/uninstall')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get('/api/v1/merchant/crm/store-customers')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(403);
  });
});
