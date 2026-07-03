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

  it('updates platform account profile fields', async () => {
    const register = await request(app.getHttpServer())
      .post('/api/v1/store/auth/register')
      .send({
        email: 'profile-user@test.com',
        password: 'password12',
        firstName: 'Old',
        lastName: 'Name',
      })
      .expect(201);
    const accountId = register.body.account.id;

    const updated = await request(app.getHttpServer())
      .patch(`/api/v1/platform/users/${accountId}`)
      .set('Authorization', `Bearer ${platformToken}`)
      .send({ firstName: 'New', phone: '+15551234567' })
      .expect(200);

    expect(updated.body).toMatchObject({
      id: accountId,
      email: 'profile-user@test.com',
      firstName: 'New',
      lastName: 'Name',
      phone: '+15551234567',
    });
  });

  it('grants platform admin role to an account', async () => {
    const register = await request(app.getHttpServer())
      .post('/api/v1/store/auth/register')
      .send({ email: 'future-admin@test.com', password: 'password12' })
      .expect(201);
    const accountId = register.body.account.id;

    const updated = await request(app.getHttpServer())
      .patch(`/api/v1/platform/users/${accountId}/identities`)
      .set('Authorization', `Bearer ${platformToken}`)
      .send({ platformAdminRole: 'REVIEWER' })
      .expect(200);

    expect(updated.body.identities).toContain('PLATFORM_ADMIN');
    expect(updated.body.platformAdminRole).toBe('REVIEWER');
    expect(updated.body.merchantRoles).toEqual([]);
  });

  it('revokes platform admin role from an account', async () => {
    const register = await request(app.getHttpServer())
      .post('/api/v1/store/auth/register')
      .send({ email: 'revoke-admin@test.com', password: 'password12' })
      .expect(201);
    const accountId = register.body.account.id;

    await request(app.getHttpServer())
      .patch(`/api/v1/platform/users/${accountId}/identities`)
      .set('Authorization', `Bearer ${platformToken}`)
      .send({ platformAdminRole: 'REVIEWER' })
      .expect(200);

    const revoked = await request(app.getHttpServer())
      .patch(`/api/v1/platform/users/${accountId}/identities`)
      .set('Authorization', `Bearer ${platformToken}`)
      .send({ platformAdminRole: null })
      .expect(200);

    expect(revoked.body.identities).not.toContain('PLATFORM_ADMIN');
  });

  it('grants distributor identity linked by accountId', async () => {
    const register = await request(app.getHttpServer())
      .post('/api/v1/store/auth/register')
      .send({ email: 'promoter@test.com', password: 'password12', firstName: 'Pat' })
      .expect(201);
    const accountId = register.body.account.id;

    const updated = await request(app.getHttpServer())
      .patch(`/api/v1/platform/users/${accountId}/identities`)
      .set('Authorization', `Bearer ${platformToken}`)
      .send({ distributor: { enabled: true, commissionRate: 0.15 } })
      .expect(200);

    expect(updated.body.identities).toContain('DISTRIBUTOR');
    expect(updated.body.distributorCommissionRate).toBe(0.15);
  });

  it('assigns merchant staff role to a tenant', async () => {
    const tenant = await prisma._seedApprovedTenant('staff-store', 'Staff Store');
    const register = await request(app.getHttpServer())
      .post('/api/v1/store/auth/register')
      .send({ email: 'staff-member@test.com', password: 'password12' })
      .expect(201);
    const accountId = register.body.account.id;

    const updated = await request(app.getHttpServer())
      .patch(`/api/v1/platform/users/${accountId}/identities`)
      .set('Authorization', `Bearer ${platformToken}`)
      .send({ merchantStaff: [{ tenantId: tenant.id, enabled: true }] })
      .expect(200);

    expect(updated.body.identities).toContain('MERCHANT_STAFF');
    expect(updated.body.merchantRoles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tenantId: tenant.id,
          role: 'MERCHANT_STAFF',
        }),
      ]),
    );
  });
});
