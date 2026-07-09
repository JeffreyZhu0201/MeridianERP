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
      businessName: 'Plugin Tenant',
      email: 'plugin@tenant.test',
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
    .send({ email: 'plugin@tenant.test', password: 'secret12' });

  return {
    ownerToken: login.body.accessToken as string,
    merchantProfileId: profile.body.id as string,
    adminToken: adminLogin.body.accessToken as string,
  };
}

describe('Merchant plugins (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;
  let ownerToken: string;
  let merchantProfileId: string;
  let adminToken: string;

  beforeEach(async () => {
    ({ app, prisma } = await createTestApp());
    ({ ownerToken, merchantProfileId, adminToken } =
      await setupApprovedMerchant(app, prisma));
  }, 15000);

  afterEach(async () => {
    await app.close();
  });

  it('defaults CRM on approved merchant', async () => {
    const installed = await request(app.getHttpServer())
      .get('/api/v1/merchant/plugins/installed-codes')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(installed.status).toBe(200);
    expect(installed.body.codes).toContain('crm');
  });

  it('lists catalog with install status', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/merchant/plugins')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThanOrEqual(7);
    const crm = res.body.items.find(
      (item: { code: string }) => item.code === 'crm',
    );
    expect(crm.installed).toBe(true);
  });

  it('blocks CRM API when CRM uninstalled', async () => {
    await request(app.getHttpServer())
      .delete('/api/v1/merchant/plugins/crm/uninstall')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    const contacts = await request(app.getHttpServer())
      .get('/api/v1/merchant/contacts')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(contacts.status).toBe(403);
  });

  it('reinstalls CRM and restores API access', async () => {
    await request(app.getHttpServer())
      .delete('/api/v1/merchant/plugins/crm/uninstall')
      .set('Authorization', `Bearer ${ownerToken}`);

    await request(app.getHttpServer())
      .post('/api/v1/merchant/plugins/crm/install')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(201);

    await request(app.getHttpServer())
      .get('/api/v1/merchant/contacts')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
  });

  it('installs and uninstalls HRM', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/merchant/plugins/hrm/install')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(201);

    const installed = await request(app.getHttpServer())
      .get('/api/v1/merchant/plugins/installed-codes')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(installed.body.codes).toContain('hrm');

    await request(app.getHttpServer())
      .delete('/api/v1/merchant/plugins/hrm/uninstall')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    const after = await request(app.getHttpServer())
      .get('/api/v1/merchant/plugins/installed-codes')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(after.body.codes).not.toContain('hrm');
  });

  it('returns admin plugin list with install timestamps', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/platform/merchants/${merchantProfileId}/plugins`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.plugins.length).toBeGreaterThanOrEqual(7);
    const crm = res.body.plugins.find(
      (p: { code: string }) => p.code === 'crm',
    );
    expect(crm.installed).toBe(true);
    expect(crm.installedAt).toBeTruthy();
  });
});
