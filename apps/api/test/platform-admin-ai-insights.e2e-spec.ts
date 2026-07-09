import { INestApplication } from '@nestjs/common';
import {
  CommissionType,
  FulfillmentType,
  LedgerStatus,
  OrderStatus,
  Prisma,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './helpers/create-test-app';
import { MockPrisma } from './helpers/mock-prisma';

async function loginPlatform(
  app: INestApplication<App>,
  email: string,
  password: string,
) {
  const res = await request(app.getHttpServer())
    .post('/api/v1/platform/auth/login')
    .send({ email, password });
  return res.body.accessToken as string;
}

describe('Platform admin AI insights (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;
  let adminToken: string;
  let fulfillmentToken: string;

  beforeEach(async () => {
    ({ app, prisma } = await createTestApp());
    const hash = await bcrypt.hash('admin123', 10);
    await prisma._seedPlatformAdmin('admin@meridian.test', hash, 'SUPER_ADMIN');
    await prisma._seedPlatformAdmin(
      'fulfillment@meridian.test',
      hash,
      'FULFILLMENT',
    );
    adminToken = await loginPlatform(app, 'admin@meridian.test', 'admin123');
    fulfillmentToken = await loginPlatform(
      app,
      'fulfillment@meridian.test',
      'admin123',
    );
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns withdrawal insight for pending request', async () => {
    const password = await bcrypt.hash('secret12', 10);
    const { tenant } = await prisma._seedMerchantOwner(
      'insight-branch',
      'Insight Branch',
      'owner@insight.test',
      password,
    );
    const passwordHash = await bcrypt.hash('promoter1', 10);
    const promoter = await prisma.distributor.create({
      data: {
        tenantId: null,
        name: 'Insight Promoter',
        email: 'promoter@insight.test',
        commissionRate: new Prisma.Decimal(10),
        commissionType: CommissionType.PERCENT,
        isActive: true,
        portalEnabled: true,
        passwordHash,
      },
    });
    await prisma.merchantProfile.update({
      where: { tenantId: tenant.id },
      data: { recruitedByDistributorId: promoter.id },
    });
    const order = await prisma.order.create({
      data: {
        tenantId: tenant.id,
        distributorId: promoter.id,
        status: OrderStatus.FULFILLED,
        subtotal: new Prisma.Decimal(100),
        tax: new Prisma.Decimal(0),
        total: new Prisma.Decimal(100),
      },
    });
    await prisma.commissionLedger.create({
      data: {
        tenantId: tenant.id,
        orderId: order.id,
        distributorId: promoter.id,
        amount: new Prisma.Decimal(20),
        status: LedgerStatus.SETTLED,
        customerOrderSequence: 1,
      },
    });
    const promoterToken = (
      await request(app.getHttpServer())
        .post('/api/v1/distributor/auth/login')
        .send({ email: 'promoter@insight.test', password: 'promoter1' })
    ).body.accessToken;
    const withdrawal = await request(app.getHttpServer())
      .post('/api/v1/distributor/me/withdrawals')
      .set('Authorization', `Bearer ${promoterToken}`)
      .send({ amount: 5, note: 'insight test' })
      .expect(201);

    const res = await request(app.getHttpServer())
      .post('/api/v1/platform/ai/insights/withdrawal')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ withdrawalId: withdrawal.body.id })
      .expect(201);

    expect(res.body.summary).toEqual(expect.any(String));
    expect(res.body.findings.length).toBeGreaterThan(0);
    expect(res.body.recommendations.length).toBeGreaterThan(0);
    expect(res.body.summary).toMatch(/提现|Insight Promoter|5/);
  });

  it('returns delivery order insight', async () => {
    const password = await bcrypt.hash('secret12', 10);
    const { tenant } = await prisma._seedMerchantOwner(
      'delivery-insight',
      'Delivery Insight',
      'owner@delivery.test',
      password,
      { isFlagship: true },
    );
    const order = await prisma.order.create({
      data: {
        tenantId: tenant.id,
        status: OrderStatus.PAID,
        fulfillmentType: FulfillmentType.DELIVERY,
        currency: 'CNY',
        subtotal: new Prisma.Decimal(80),
        tax: new Prisma.Decimal(0),
        total: new Prisma.Decimal(80),
        guestEmail: 'buyer@example.com',
      },
    });

    const res = await request(app.getHttpServer())
      .post('/api/v1/platform/ai/insights/delivery-order')
      .set('Authorization', `Bearer ${fulfillmentToken}`)
      .send({ orderId: order.id })
      .expect(201);

    expect(res.body.summary).toMatch(/PAID|配送|delivery-insight/i);
    expect(res.body.findings.length).toBeGreaterThan(0);
  });

  it('returns funds insight for inventory-cost metric', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/platform/ai/insights/funds')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ metric: 'inventory-cost' })
      .expect(201);

    expect(res.body.summary).toEqual(expect.any(String));
    expect(res.body.findings.length).toBeGreaterThan(0);
    expect(
      res.body.sources.some((s: { type: string }) => s.type === 'funds'),
    ).toBe(true);
  });

  it('forbids fulfillment role from withdrawal insight', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/platform/ai/insights/withdrawal')
      .set('Authorization', `Bearer ${fulfillmentToken}`)
      .send({ withdrawalId: 'wd_missing' })
      .expect(403);
  });
});
