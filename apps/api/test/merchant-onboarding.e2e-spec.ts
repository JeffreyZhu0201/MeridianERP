import { INestApplication } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './helpers/create-test-app';
import { MockPrisma } from './helpers/mock-prisma';

describe('MerchantOnboarding (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;
  let platformToken: string;
  let merchantToken: string;
  let profileId: string;

  beforeEach(async () => {
    ({ app, prisma } = await createTestApp());
    const hash = await bcrypt.hash('admin123', 10);
    await prisma._seedPlatformAdmin('admin@meridian.test', hash, 'SUPER_ADMIN');

    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/platform/auth/login')
      .send({ email: 'admin@meridian.test', password: 'admin123' });
    platformToken = adminLogin.body.accessToken;

    const register = await request(app.getHttpServer())
      .post('/api/v1/merchant/auth/register')
      .send({
        businessName: 'Acme Corp',
        email: 'owner@acme.test',
        password: 'secret12',
      });
    merchantToken = register.body.accessToken;
    expect(register.body.onboardingStatus).toBe('DRAFT');
  });

  afterEach(async () => {
    await app.close();
  });

  it('full onboarding flow: register → submit → approve → login', async () => {
    const profile = await request(app.getHttpServer())
      .get('/api/v1/merchant/onboarding')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);
    profileId = profile.body.id;

    await request(app.getHttpServer())
      .patch('/api/v1/merchant/onboarding')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({ legalName: 'Acme Corporation LLC' })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/v1/merchant/onboarding/submit')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(201);

    const list = await request(app.getHttpServer())
      .get('/api/v1/platform/merchants')
      .set('Authorization', `Bearer ${platformToken}`)
      .expect(200);
    expect(list.body.data.length).toBeGreaterThan(0);

    await request(app.getHttpServer())
      .post(`/api/v1/platform/merchants/${profileId}/approve`)
      .set('Authorization', `Bearer ${platformToken}`)
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/merchant/auth/login')
      .send({ email: 'owner@acme.test', password: 'secret12' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/merchant/auth/login')
      .send({ email: 'owner@acme.test', password: 'wrong12' })
      .expect(401);
  });

  it('blocks merchant login before approval', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/merchant/auth/login')
      .send({ email: 'owner@acme.test', password: 'secret12' })
      .expect(403);
  });

  it('platform can reject merchant application', async () => {
    const profile = await request(app.getHttpServer())
      .get('/api/v1/merchant/onboarding')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/v1/merchant/onboarding/submit')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/platform/merchants/${profile.body.id}/reject`)
      .set('Authorization', `Bearer ${platformToken}`)
      .send({ reason: 'Incomplete documentation' })
      .expect(201);
  });
});
