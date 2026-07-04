import { INestApplication } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './helpers/create-test-app';
import { MockPrisma } from './helpers/mock-prisma';

async function setupApprovedMerchant(
  app: INestApplication<App>,
  prisma: MockPrisma,
) {
  const hash = await bcrypt.hash('admin123', 10);
  await prisma._seedPlatformAdmin('admin@meridian.test', hash, 'SUPER_ADMIN');
  const adminLogin = await request(app.getHttpServer())
    .post('/api/v1/platform/auth/login')
    .send({ email: 'admin@meridian.test', password: 'admin123' });

  const register = await request(app.getHttpServer())
    .post('/api/v1/merchant/auth/register')
    .send({
      businessName: 'Auth Test Store',
      email: 'auth@merchant.test',
      password: 'secret12',
    });

  const tokenDraft = register.body.accessToken;

  const profile = await request(app.getHttpServer())
    .get('/api/v1/merchant/onboarding')
    .set('Authorization', `Bearer ${tokenDraft}`);

  await request(app.getHttpServer())
    .post('/api/v1/merchant/onboarding/submit')
    .set('Authorization', `Bearer ${tokenDraft}`);

  await request(app.getHttpServer())
    .post(`/api/v1/platform/merchants/${profile.body.id}/approve`)
    .set('Authorization', `Bearer ${adminLogin.body.accessToken}`);

  const login = await request(app.getHttpServer())
    .post('/api/v1/merchant/auth/login')
    .send({ email: 'auth@merchant.test', password: 'secret12' });

  return login.body.accessToken as string;
}

describe('Merchant auth (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;
  let token: string;

  beforeEach(async () => {
    ({ app, prisma } = await createTestApp());
    token = await setupApprovedMerchant(app, prisma);
  }, 15000);

  afterEach(async () => {
    await app.close();
  });

  it('GET /merchant/auth/me returns 401 without token', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/merchant/auth/me')
      .expect(401);
  });

  it('GET /merchant/auth/me returns current user profile', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/merchant/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.email).toBe('auth@merchant.test');
    expect(res.body.role).toBe('MERCHANT_OWNER');
    expect(typeof res.body.displayName).toBe('string');
    expect(res.body.displayName.length).toBeGreaterThan(0);
  });
});
