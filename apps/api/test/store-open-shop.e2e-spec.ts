import { INestApplication } from '@nestjs/common';
import { CommissionType } from '@prisma/client';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './helpers/create-test-app';
import { MockPrisma } from './helpers/mock-prisma';

describe('StoreOpenShop (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;
  let platformToken: string;
  let inviteCode: string;

  beforeEach(async () => {
    ({ app, prisma } = await createTestApp());
    const hash = await bcrypt.hash('admin123', 10);
    await prisma._seedPlatformAdmin('admin@meridian.test', hash, 'SUPER_ADMIN');
    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/platform/auth/login')
      .send({ email: 'admin@meridian.test', password: 'admin123' });
    platformToken = adminLogin.body.accessToken;

    const promoter = await prisma.distributor.create({
      data: {
        tenantId: null,
        name: 'Field Rep',
        commissionRate: new Prisma.Decimal(8),
        commissionType: CommissionType.PERCENT,
        isActive: true,
      },
    });
    const invite = await prisma.merchantRecruitInviteCode.create({
      data: {
        code: 'ABCDEF',
        distributorId: promoter.id,
        revokedAt: null,
        expiresAt: null,
      },
    });
    inviteCode = invite.code;
  });

  afterEach(async () => {
    await app.close();
  });

  it('previews invite code publicly', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/store/merchant-applications/invite/${inviteCode}`)
      .expect(200);

    expect(res.body).toMatchObject({
      code: inviteCode,
      promoterName: 'Field Rep',
    });
  });

  it('submits merchant application with store auth and invite', async () => {
    const register = await request(app.getHttpServer())
      .post('/api/v1/store/auth/register')
      .send({
        email: 'shopowner@example.com',
        password: 'password12',
        firstName: 'Store',
        lastName: 'Owner',
      })
      .expect(201);

    const storeToken = register.body.accessToken as string;

    const submit = await request(app.getHttpServer())
      .post('/api/v1/store/merchant-applications')
      .set('Authorization', `Bearer ${storeToken}`)
      .send({
        inviteCode,
        businessName: 'Corner Shop',
        contactPhone: '13800000000',
      })
      .expect(201);

    expect(submit.body).toMatchObject({
      businessName: 'Corner Shop',
      onboardingStatus: 'SUBMITTED',
      pendingRecruitInviteCode: inviteCode,
    });

    const me = await request(app.getHttpServer())
      .get('/api/v1/store/merchant-applications/me')
      .set('Authorization', `Bearer ${storeToken}`)
      .expect(200);

    expect(me.body.onboardingStatus).toBe('SUBMITTED');
  });

  it('submits merchant application without invite code', async () => {
    const register = await request(app.getHttpServer())
      .post('/api/v1/store/auth/register')
      .send({
        email: 'direct-owner@example.com',
        password: 'password12',
        firstName: 'Direct',
        lastName: 'Owner',
      })
      .expect(201);

    const storeToken = register.body.accessToken as string;

    const submit = await request(app.getHttpServer())
      .post('/api/v1/store/merchant-applications')
      .set('Authorization', `Bearer ${storeToken}`)
      .send({
        businessName: 'Direct Shop',
      })
      .expect(201);

    expect(submit.body).toMatchObject({
      businessName: 'Direct Shop',
      onboardingStatus: 'SUBMITTED',
      pendingRecruitInviteCode: null,
    });
  });

  it('creates promoter from platform account', async () => {
    const register = await request(app.getHttpServer())
      .post('/api/v1/store/auth/register')
      .send({ email: 'promoter@example.com', password: 'password12' })
      .expect(201);

    const created = await request(app.getHttpServer())
      .post('/api/v1/platform/distributors')
      .set('Authorization', `Bearer ${platformToken}`)
      .send({
        accountId: register.body.account.id,
        commissionRate: 12,
        commissionType: 'PERCENT',
      })
      .expect(201);

    expect(created.body.accountId).toBe(register.body.account.id);
    expect(created.body.email).toBe('promoter@example.com');
  });
});
