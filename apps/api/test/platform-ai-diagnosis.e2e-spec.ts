import { INestApplication } from '@nestjs/common';
import { FulfillmentType, OrderStatus, Prisma } from '@prisma/client';
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

describe('Platform AI diagnosis (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;
  let adminToken: string;
  let orderId: string;

  beforeEach(async () => {
    ({ app, prisma } = await createTestApp());
    const hash = await bcrypt.hash('admin123', 10);
    await prisma._seedPlatformAdmin('admin@meridian.test', hash, 'SUPER_ADMIN');

    const password = await bcrypt.hash('demo1234', 10);
    const { tenant } = await prisma._seedMerchantOwner(
      'diag-branch',
      'Diag Branch',
      'owner@diag.test',
      password,
    );

    const order = await prisma.order.create({
      data: {
        tenantId: tenant.id,
        status: OrderStatus.PAID,
        fulfillmentType: FulfillmentType.PICKUP,
        currency: 'CNY',
        subtotal: new Prisma.Decimal(100),
        tax: new Prisma.Decimal(0),
        total: new Prisma.Decimal(100),
      },
    });
    orderId = order.id;

    adminToken = await loginAdmin(app);
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns diagnosis report for order commission question', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/platform/ai/diagnosis')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ query: `订单 ${orderId} 为何没有佣金？` })
      .expect(201);

    expect(res.body.report).toEqual(expect.any(String));
    expect(res.body.cards.length).toBeGreaterThan(0);
    expect(
      res.body.cards.some((c: { domain: string }) => c.domain === 'commission'),
    ).toBe(true);
    expect(res.body.report).toMatch(/配货|ALLOCATION|佣金/);
  });

  it('forbids fulfillment role from diagnosis', async () => {
    const hash = await bcrypt.hash('admin123', 10);
    await prisma._seedPlatformAdmin(
      'fulfillment@meridian.test',
      hash,
      'FULFILLMENT',
    );
    const fulfillmentToken = (
      await request(app.getHttpServer())
        .post('/api/v1/platform/auth/login')
        .send({ email: 'fulfillment@meridian.test', password: 'admin123' })
    ).body.accessToken;

    await request(app.getHttpServer())
      .post('/api/v1/platform/ai/diagnosis')
      .set('Authorization', `Bearer ${fulfillmentToken}`)
      .send({ query: '平台资金情况' })
      .expect(403);
  });
});
