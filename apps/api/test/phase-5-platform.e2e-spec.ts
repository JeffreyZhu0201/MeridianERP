import { INestApplication } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './helpers/create-test-app';
import { MockPrisma } from './helpers/mock-prisma';

async function loginPlatform(app: INestApplication<App>) {
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

describe('Phase5 Platform (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;
  let platformToken: string;
  let merchantToken: string;

  beforeEach(async () => {
    ({ app, prisma } = await createTestApp());
    const hash = await bcrypt.hash('admin123', 10);
    await prisma._seedPlatformAdmin('admin@meridian.test', hash, 'SUPER_ADMIN');
    platformToken = await loginPlatform(app);

    const password = await bcrypt.hash('secret12', 10);
    await prisma._seedMerchantOwner(
      'branch-one',
      'Branch One',
      'owner@branch.test',
      password,
    );
    merchantToken = await loginMerchant(app, 'owner@branch.test', 'secret12');
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /platform/funds/summary returns Phase 5 fund fields', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/platform/funds/summary')
      .set('Authorization', `Bearer ${platformToken}`)
      .expect(200);

    expect(res.body).toMatchObject({
      gmv: expect.anything(),
      wholesaleRevenue: expect.anything(),
      commissionLiability: expect.anything(),
      accruedAwaitingSettlement: expect.anything(),
      from: expect.any(String),
      to: expect.any(String),
    });
    expect(Array.isArray(res.body.gmvTrend)).toBe(true);
  });

  it('GET /platform/funds/summary accepts date range query', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/platform/funds/summary?from=2025-01-01&to=2025-06-01')
      .set('Authorization', `Bearer ${platformToken}`)
      .expect(200);
  });

  it('GET /merchant/funds/summary returns branch net position fields', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/merchant/funds/summary')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    expect(res.body).toMatchObject({
      pickupGmv: expect.anything(),
      pickupGrossProfit: expect.anything(),
      allocationCost: expect.anything(),
      deliveryAllocationCost: expect.anything(),
      netPosition: expect.anything(),
    });
  });

  it('platform allocation routes require auth', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/platform/allocations')
      .expect(401);
  });

  it('GET /platform/procurement/orders returns list for admin', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/platform/procurement/orders?status=ALL')
      .set('Authorization', `Bearer ${platformToken}`)
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /merchant/allocations returns list for merchant', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/merchant/allocations')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /platform/distributors creates platform-scoped partner', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/platform/distributors')
      .set('Authorization', `Bearer ${platformToken}`)
      .send({ name: 'Channel Partner', commissionRate: 8 })
      .expect(201);
    expect(res.body).toMatchObject({
      name: 'Channel Partner',
      commissionRate: 8,
      isActive: true,
      portalEnabled: false,
      recruitedMerchantCount: 0,
    });
    expect(res.body.id).toBeDefined();
  });
});
