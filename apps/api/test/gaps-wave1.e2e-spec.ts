import { INestApplication } from '@nestjs/common';
import { OnboardingStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './helpers/create-test-app';
import { MockPrisma } from './helpers/mock-prisma';

async function loginMerchant(
  app: INestApplication<App>,
  email = 'demo@merchant.test',
  password = 'demo1234',
) {
  const res = await request(app.getHttpServer())
    .post('/api/v1/merchant/auth/login')
    .send({ email, password });
  return res.body.accessToken as string;
}

describe('Merchant dashboard (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;
  let token: string;

  beforeEach(async () => {
    ({ app, prisma } = await createTestApp());
    const hash = await bcrypt.hash('demo1234', 10);
    const tenant = await prisma._seedApprovedTenant('demo', 'Demo Store');
    await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: 'demo@merchant.test',
        password: hash,
        role: 'MERCHANT_OWNER',
      },
    });
    token = await loginMerchant(app);
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /merchant/dashboard returns aggregates', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/merchant/dashboard')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.businessName).toBe('Demo Store');
    expect(typeof res.body.contactsCount).toBe('number');
    expect(Array.isArray(res.body.recentLeads)).toBe(true);
    expect(Array.isArray(res.body.recentActivity)).toBe(true);
  });
});

describe('Platform merchants list filters (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;
  let platformToken: string;

  beforeEach(async () => {
    ({ app, prisma } = await createTestApp());
    const hash = await bcrypt.hash('admin123', 10);
    await prisma._seedPlatformAdmin('admin@meridian.test', hash, 'SUPER_ADMIN');
    const login = await request(app.getHttpServer())
      .post('/api/v1/platform/auth/login')
      .send({ email: 'admin@meridian.test', password: 'admin123' });
    platformToken = login.body.accessToken;

    const tenant = await prisma._seedApprovedTenant('filter-co', 'Filter Co');
    await prisma.merchantProfile.create({
      data: {
        tenantId: tenant.id,
        businessName: 'Pending Filter Co',
        contactEmail: 'pending@filter.test',
        onboardingStatus: OnboardingStatus.SUBMITTED,
      },
    });
  });

  afterEach(async () => {
    await app.close();
  });

  it('filters merchants by status', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/platform/merchants')
      .query({ status: OnboardingStatus.SUBMITTED })
      .set('Authorization', `Bearer ${platformToken}`)
      .expect(200);

    expect(res.body.data.every((m: { onboardingStatus: string }) => m.onboardingStatus === 'SUBMITTED')).toBe(true);
  });

  it('filters merchants by search term', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/platform/merchants')
      .query({ search: 'pending@filter' })
      .set('Authorization', `Bearer ${platformToken}`)
      .expect(200);

    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].contactEmail).toContain('pending@filter');
  });
});
