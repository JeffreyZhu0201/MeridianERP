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
      businessName: 'Tenant A',
      email: 'a@tenant.test',
      password: 'secret12',
    });
  const tokenA = register.body.accessToken;

  const profile = await request(app.getHttpServer())
    .get('/api/v1/merchant/onboarding')
    .set('Authorization', `Bearer ${tokenA}`);

  await request(app.getHttpServer())
    .post('/api/v1/merchant/onboarding/submit')
    .set('Authorization', `Bearer ${tokenA}`);

  await request(app.getHttpServer())
    .post(`/api/v1/platform/merchants/${profile.body.id}/approve`)
    .set('Authorization', `Bearer ${adminLogin.body.accessToken}`);

  const loginA = await request(app.getHttpServer())
    .post('/api/v1/merchant/auth/login')
    .send({ email: 'a@tenant.test', password: 'secret12' });

  const registerB = await request(app.getHttpServer())
    .post('/api/v1/merchant/auth/register')
    .send({
      businessName: 'Tenant B',
      email: 'b@tenant.test',
      password: 'secret12',
    });
  const tokenB = registerB.body.accessToken;
  const profileB = await request(app.getHttpServer())
    .get('/api/v1/merchant/onboarding')
    .set('Authorization', `Bearer ${tokenB}`);
  await request(app.getHttpServer())
    .post('/api/v1/merchant/onboarding/submit')
    .set('Authorization', `Bearer ${tokenB}`);
  await request(app.getHttpServer())
    .post(`/api/v1/platform/merchants/${profileB.body.id}/approve`)
    .set('Authorization', `Bearer ${adminLogin.body.accessToken}`);
  const loginB = await request(app.getHttpServer())
    .post('/api/v1/merchant/auth/login')
    .send({ email: 'b@tenant.test', password: 'secret12' });

  return {
    tokenA: loginA.body.accessToken,
    tokenB: loginB.body.accessToken,
  };
}

describe('CRM (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;
  let tokenA: string;
  let tokenB: string;

  beforeEach(async () => {
    ({ app, prisma } = await createTestApp());
    ({ tokenA, tokenB } = await setupApprovedMerchant(app, prisma));
  }, 15000);

  afterEach(async () => {
    await app.close();
  });

  it('CRUD companies, contacts, leads, activities', async () => {
    const company = await request(app.getHttpServer())
      .post('/api/v1/merchant/companies')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Globex' })
      .expect(201);
    expect(company.body.name).toBe('Globex');

    const contact = await request(app.getHttpServer())
      .post('/api/v1/merchant/contacts')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ firstName: 'Jane', lastName: 'Doe', companyId: company.body.id })
      .expect(201);

    const lead = await request(app.getHttpServer())
      .post('/api/v1/merchant/leads')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'New deal', contactId: contact.body.id })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/api/v1/merchant/leads/${lead.body.id}/stage`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ stage: 'QUALIFIED' })
      .expect(200);

    const activity = await request(app.getHttpServer())
      .post('/api/v1/merchant/activities')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ type: 'CALL', note: 'Intro call', contactId: contact.body.id })
      .expect(201);
    expect(activity.body.type).toBe('CALL');
  });

  it('enforces tenant isolation', async () => {
    const company = await request(app.getHttpServer())
      .post('/api/v1/merchant/companies')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Secret Co' })
      .expect(201);

    await request(app.getHttpServer())
      .get(`/api/v1/merchant/companies/${company.body.id}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404);

    const listB = await request(app.getHttpServer())
      .get('/api/v1/merchant/companies')
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);
    expect(listB.body).toEqual([]);
  });
});
