import { INestApplication } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './helpers/create-test-app';
import { MockPrisma } from './helpers/mock-prisma';

describe('PlatformSettings (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;
  let adminToken: string;
  let merchantToken: string;

  beforeEach(async () => {
    ({ app, prisma } = await createTestApp());
    const hash = await bcrypt.hash('admin123', 10);
    await prisma._seedPlatformAdmin('admin@meridian.test', hash, 'SUPER_ADMIN');

    const login = await request(app.getHttpServer())
      .post('/api/v1/platform/auth/login')
      .send({ email: 'admin@meridian.test', password: 'admin123' })
      .expect(201);
    adminToken = login.body.accessToken as string;

    const ownerHash = await bcrypt.hash('merchant12', 10);
    await prisma._seedMerchantOwner('plat-settings', 'Plat Store', 'm@plat.test', ownerHash);
    const merchantLogin = await request(app.getHttpServer())
      .post('/api/v1/merchant/auth/login')
      .send({ email: 'm@plat.test', password: 'merchant12' });
    merchantToken = merchantLogin.body.accessToken as string;
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /platform/settings returns defaults for admin', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/platform/settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.platformName).toBe('MeridianERP');
    expect(res.body.stripeMode).toBe('mock');
    expect(res.body.webhookUrl).toContain('/webhooks/stripe');
    expect(res.body.distributorPortalEnabled).toBe(true);
  });

  it('PATCH /platform/settings updates platform info', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/v1/platform/settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        platformName: 'Meridian Test',
        supportEmail: 'support@meridian.test',
        emailQueueEnabled: false,
      })
      .expect(200);

    expect(res.body.platformName).toBe('Meridian Test');
    expect(res.body.supportEmail).toBe('support@meridian.test');
    expect(res.body.emailQueueEnabled).toBe(false);
  });

  it('rejects merchant token on platform settings', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/platform/settings')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(401);
  });
});
