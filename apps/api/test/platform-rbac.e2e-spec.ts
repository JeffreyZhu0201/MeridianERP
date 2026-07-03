import { INestApplication } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './helpers/create-test-app';
import { MockPrisma } from './helpers/mock-prisma';

async function loginAs(
  app: INestApplication<App>,
  email: string,
  password: string,
) {
  const res = await request(app.getHttpServer())
    .post('/api/v1/platform/auth/login')
    .send({ email, password });
  return res.body.accessToken as string;
}

describe('Platform RBAC (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;
  let financeToken: string;
  let fulfillmentToken: string;
  let reviewerToken: string;

  beforeEach(async () => {
    ({ app, prisma } = await createTestApp());
    const hash = await bcrypt.hash('admin123', 10);
    await prisma._seedPlatformAdmin('admin@meridian.test', hash, 'SUPER_ADMIN');
    await prisma._seedPlatformAdmin('finance@meridian.test', hash, 'FINANCE');
    await prisma._seedPlatformAdmin('fulfillment@meridian.test', hash, 'FULFILLMENT');
    await prisma._seedPlatformAdmin('reviewer@meridian.test', hash, 'REVIEWER');

    financeToken = await loginAs(app, 'finance@meridian.test', 'admin123');
    fulfillmentToken = await loginAs(app, 'fulfillment@meridian.test', 'admin123');
    reviewerToken = await loginAs(app, 'reviewer@meridian.test', 'admin123');
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns role permissions from GET /platform/auth/me', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/platform/auth/me')
      .set('Authorization', `Bearer ${financeToken}`)
      .expect(200);

    expect(res.body).toMatchObject({
      email: 'finance@meridian.test',
      role: 'FINANCE',
      homePath: '/funds',
    });
    expect(res.body.permissions).toEqual(
      expect.arrayContaining(['funds', 'settlements', 'withdrawals']),
    );
    expect(res.body.permissions).not.toContain('merchants');
  });

  it('allows finance to access funds and forbids merchants', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/platform/funds/summary')
      .set('Authorization', `Bearer ${financeToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get('/api/v1/platform/merchants')
      .set('Authorization', `Bearer ${financeToken}`)
      .expect(403);
  });

  it('allows fulfillment to list orders and forbids funds', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/platform/orders')
      .set('Authorization', `Bearer ${fulfillmentToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get('/api/v1/platform/funds/summary')
      .set('Authorization', `Bearer ${fulfillmentToken}`)
      .expect(403);
  });

  it('allows reviewer to list merchants and forbids distributors', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/platform/merchants')
      .set('Authorization', `Bearer ${reviewerToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get('/api/v1/platform/distributors')
      .set('Authorization', `Bearer ${reviewerToken}`)
      .expect(403);
  });

  it('allows all roles to access dashboard', async () => {
    for (const token of [financeToken, fulfillmentToken, reviewerToken]) {
      await request(app.getHttpServer())
        .get('/api/v1/platform/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    }
  });
});
