import { INestApplication } from '@nestjs/common';
import { CommissionType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './helpers/create-test-app';
import { MockPrisma } from './helpers/mock-prisma';

async function loginMerchant(
  app: INestApplication<App>,
  email: string,
  password: string,
) {
  const res = await request(app.getHttpServer())
    .post('/api/v1/merchant/auth/login')
    .send({ email, password });
  return res.body.accessToken as string;
}

describe('MerchantSettings (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;
  let ownerToken: string;
  let staffToken: string;
  let staffId: string;

  beforeEach(async () => {
    ({ app, prisma } = await createTestApp());
    const ownerHash = await bcrypt.hash('owner1234', 10);
    const staffHash = await bcrypt.hash('staff1234', 10);
    const { tenant, user: owner } = await prisma._seedMerchantOwner(
      'settings-store',
      'Settings Store',
      'owner@settings.test',
      ownerHash,
    );
    ownerToken = await loginMerchant(app, 'owner@settings.test', 'owner1234');

    const staff = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: 'staff@settings.test',
        password: staffHash,
        role: 'MERCHANT_STAFF',
      },
    });
    staffId = staff.id;
    staffToken = await loginMerchant(app, 'staff@settings.test', 'staff1234');
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /merchant/settings returns profile and defaults', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/merchant/settings')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(res.body.profile.businessName).toBe('Settings Store');
    expect(res.body.stripeMode).toBe('mock');
    expect(res.body.storeUrl).toContain('/s/settings-store');
  });

  it('owner can PATCH settings', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/v1/merchant/settings')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        businessName: 'Updated Store',
        defaultCommissionRate: 12.5,
        defaultCommissionType: CommissionType.PERCENT,
        notifyOnCommission: false,
      })
      .expect(200);

    expect(res.body.profile.businessName).toBe('Updated Store');
    expect(res.body.defaultCommissionRate).toBe('12.5');
    expect(res.body.notifyOnCommission).toBe(false);
  });

  it('owner can PATCH legalName and storeAddress', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/v1/merchant/settings')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        legalName: 'Settings Store LLC',
        storeAddress: '123 Main Street, Shanghai',
      })
      .expect(200);

    expect(res.body.profile.legalName).toBe('Settings Store LLC');
    expect(res.body.profile.storeAddress).toBe('123 Main Street, Shanghai');

    const getRes = await request(app.getHttpServer())
      .get('/api/v1/merchant/settings')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(getRes.body.profile.legalName).toBe('Settings Store LLC');
    expect(getRes.body.profile.storeAddress).toBe('123 Main Street, Shanghai');
  });

  it('staff cannot PATCH settings', async () => {
    await request(app.getHttpServer())
      .patch('/api/v1/merchant/settings')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ businessName: 'Hacked' })
      .expect(403);
  });

  it('owner can manage team members', async () => {
    const list = await request(app.getHttpServer())
      .get('/api/v1/merchant/team')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(list.body.length).toBeGreaterThanOrEqual(2);

    const created = await request(app.getHttpServer())
      .post('/api/v1/merchant/team')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: 'newstaff@settings.test', password: 'newpass1234' })
      .expect(201);

    expect(created.body.email).toBe('newstaff@settings.test');
    expect(created.body.role).toBe('MERCHANT_STAFF');

    await request(app.getHttpServer())
      .delete(`/api/v1/merchant/team/${created.body.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
  });

  it('staff cannot POST team members', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/merchant/team')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ email: 'blocked@settings.test', password: 'newpass1234' })
      .expect(403);
  });

  it('staff cannot delete team members', async () => {
    await request(app.getHttpServer())
      .delete(`/api/v1/merchant/team/${staffId}`)
      .set('Authorization', `Bearer ${staffToken}`)
      .expect(403);
  });
});
