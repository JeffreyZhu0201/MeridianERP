import { INestApplication } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './helpers/create-test-app';
import { MockPrisma } from './helpers/mock-prisma';

describe('PlatformUsers (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;
  let platformToken: string;

  beforeEach(async () => {
    ({ app, prisma } = await createTestApp());
    const hash = await bcrypt.hash('admin123', 10);
    await prisma._seedPlatformAdmin('admin@meridian.test', hash, 'SUPER_ADMIN');
    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/platform/auth/login')
      .send({ email: 'admin@meridian.test', password: 'admin123' });
    platformToken = adminLogin.body.accessToken;
  });

  afterEach(async () => {
    await app.close();
  });

  it('lists platform accounts after store registration', async () => {
    await prisma._seedApprovedTenant('acme-store', 'Acme Store');
    await request(app.getHttpServer())
      .post('/api/v1/store/acme-store/auth/register')
      .send({
        email: 'shopper@example.com',
        password: 'password12',
        firstName: 'Jane',
        lastName: 'Doe',
      })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get('/api/v1/platform/users')
      .set('Authorization', `Bearer ${platformToken}`)
      .expect(200);

    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toMatchObject({
      email: 'shopper@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
    });
    expect(res.body.data[0].identities).toContain('CONSUMER');
  });

  it('creates merchant with owner and owner can login', async () => {
    const register = await request(app.getHttpServer())
      .post('/api/v1/store/auth/register')
      .send({ email: 'owner@branch.test', password: 'password12' })
      .expect(201);
    const ownerAccountId = register.body.account.id;

    const created = await request(app.getHttpServer())
      .post('/api/v1/platform/merchants')
      .set('Authorization', `Bearer ${platformToken}`)
      .send({
        businessName: 'Branch One',
        contactEmail: 'branch@merchant.test',
        ownerAccountId,
      })
      .expect(201);

    expect(created.body.onboardingStatus).toBe('APPROVED');

    await request(app.getHttpServer())
      .post('/api/v1/merchant/auth/login')
      .send({ email: 'owner@branch.test', password: 'password12' })
      .expect(201);
  });

  it('rejects duplicate merchant owner assignment', async () => {
    const register = await request(app.getHttpServer())
      .post('/api/v1/store/auth/register')
      .send({ email: 'owner2@branch.test', password: 'password12' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/platform/merchants')
      .set('Authorization', `Bearer ${platformToken}`)
      .send({
        businessName: 'Branch A',
        contactEmail: 'a@merchant.test',
        ownerAccountId: register.body.account.id,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/platform/merchants')
      .set('Authorization', `Bearer ${platformToken}`)
      .send({
        businessName: 'Branch B',
        contactEmail: 'b@merchant.test',
        ownerAccountId: register.body.account.id,
      })
      .expect(400);
  });
});
