import { INestApplication } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './helpers/create-test-app';
import { MockPrisma } from './helpers/mock-prisma';

async function loginAdmin(app: INestApplication<App>) {
  const res = await request(app.getHttpServer())
    .post('/api/v1/platform/auth/login')
    .send({ email: 'admin@meridian.test', password: 'admin123' });
  return res.body.accessToken as string;
}

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

describe('Platform AI call logs (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;
  let adminToken: string;
  let merchantToken: string;

  beforeEach(async () => {
    ({ app, prisma } = await createTestApp());
    const hash = await bcrypt.hash('admin123', 10);
    await prisma._seedPlatformAdmin('admin@meridian.test', hash, 'SUPER_ADMIN');

    const password = await bcrypt.hash('secret12', 10);
    await prisma._seedMerchantOwner(
      'ai-log-store',
      'AI Log Store',
      'owner@ai-log.test',
      password,
    );
    merchantToken = await loginMerchant(app, 'owner@ai-log.test', 'secret12');
    adminToken = await loginAdmin(app);
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns live=false status in test mock mode', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/platform/ai/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.live).toBe(false);
  });

  it('records replenishment AI calls and lists them for admin', async () => {
    const product = await request(app.getHttpServer())
      .post('/api/v1/merchant/products')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        name: 'Logged Widget',
        isPublished: true,
        variants: [{ sku: 'LOG-1', name: 'Default', price: 50, inventory: 10 }],
      })
      .expect(201);

    const variantId = product.body.variants[0].id;

    await request(app.getHttpServer())
      .post('/api/v1/merchant/inventory/adjustments')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        variantId,
        quantityDelta: -8,
        reason: 'COUNT_CORRECTION',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/merchant/inventory/ai/replenishment')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(201);

    const logs = await request(app.getHttpServer())
      .get('/api/v1/platform/ai/calls?feature=MERCHANT_REPLENISHMENT')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(logs.body.total).toBeGreaterThanOrEqual(1);
    expect(
      logs.body.items.some(
        (item: { feature: string; mode: string }) =>
          item.feature === 'MERCHANT_REPLENISHMENT' && item.mode === 'MOCK',
      ),
    ).toBe(true);
  });

  it('rejects call log access with merchant token', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/platform/ai/calls')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(401);
  });
});
