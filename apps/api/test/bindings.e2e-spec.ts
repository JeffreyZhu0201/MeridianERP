import { INestApplication } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './helpers/create-test-app';
import { MockPrisma } from './helpers/mock-prisma';

async function setupApprovedMerchantWithDistributor(
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
      businessName: 'Bind Corp',
      email: 'bind@corp.test',
      password: 'secret12',
    });
  const draftToken = register.body.accessToken;
  const tenantId = register.body.tenantId;
  const profile = await request(app.getHttpServer())
    .get('/api/v1/merchant/onboarding')
    .set('Authorization', `Bearer ${draftToken}`);
  await request(app.getHttpServer())
    .post('/api/v1/merchant/onboarding/submit')
    .set('Authorization', `Bearer ${draftToken}`);
  await request(app.getHttpServer())
    .post(`/api/v1/platform/merchants/${profile.body.id}/approve`)
    .set('Authorization', `Bearer ${adminLogin.body.accessToken}`);

  const login = await request(app.getHttpServer())
    .post('/api/v1/merchant/auth/login')
    .send({ email: 'bind@corp.test', password: 'secret12' });

  const distributor = await request(app.getHttpServer())
    .post('/api/v1/merchant/distributors')
    .set('Authorization', `Bearer ${login.body.accessToken}`)
    .send({ name: 'Dist One', commissionRate: 10 })
    .expect(201);

  return {
    merchantToken: login.body.accessToken,
    tenantId,
    distributorId: distributor.body.id,
  };
}

describe('Bindings (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;
  let merchantToken: string;
  let distributorId: string;

  beforeEach(async () => {
    ({ app, prisma } = await createTestApp());
    ({ merchantToken, distributorId } =
      await setupApprovedMerchantWithDistributor(app, prisma));
  });

  afterEach(async () => {
    await app.close();
  });

  it('generates QR, verifies token, and claims binding', async () => {
    const qr = await request(app.getHttpServer())
      .post(`/api/v1/merchant/distributors/${distributorId}/qr`)
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({ bindType: 'MERCHANT' })
      .expect(201);

    expect(qr.body.token).toBeDefined();
    expect(qr.body.url).toContain('/bind/');

    const verify = await request(app.getHttpServer())
      .get(`/api/v1/bindings/verify/${qr.body.token}`)
      .expect(200);
    expect(verify.body.valid).toBe(true);
    expect(verify.body.distributorId).toBe(distributorId);

    const claim = await request(app.getHttpServer())
      .post('/api/v1/bindings/claim')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({ token: qr.body.token })
      .expect(201);
    expect(claim.body.distributorId).toBe(distributorId);

    await request(app.getHttpServer())
      .post('/api/v1/bindings/claim')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({ token: qr.body.token })
      .expect(409);
  });

  it('CRUD distributors', async () => {
    const list = await request(app.getHttpServer())
      .get('/api/v1/merchant/distributors')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);
    expect(list.body.length).toBeGreaterThan(0);

    const updated = await request(app.getHttpServer())
      .patch(`/api/v1/merchant/distributors/${distributorId}`)
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({ name: 'Dist Updated' })
      .expect(200);
    expect(updated.body.name).toBe('Dist Updated');
  });
});
