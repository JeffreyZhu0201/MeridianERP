import { INestApplication } from '@nestjs/common';
import { OnboardingStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './helpers/create-test-app';
import { MockPrisma } from './helpers/mock-prisma';

async function loginPlatform(app: INestApplication<App>) {
  const res = await request(app.getHttpServer())
    .post('/api/v1/platform/auth/login')
    .send({ email: 'admin@meridian.test', password: 'admin123' });
  return res.body.accessToken as string;
}

describe('Platform merchant store settings (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;
  let platformToken: string;
  let merchantProfileId: string;

  beforeEach(async () => {
    ({ app, prisma } = await createTestApp());
    const hash = await bcrypt.hash('admin123', 10);
    await prisma._seedPlatformAdmin('admin@meridian.test', hash, 'SUPER_ADMIN');
    platformToken = await loginPlatform(app);

    const tenant = await prisma._seedApprovedTenant('flagship-a', 'Flagship A');
    const profile = await prisma.merchantProfile.findUnique({
      where: { tenantId: tenant.id },
    });
    merchantProfileId = profile!.id;
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET merchant detail includes storePublished and isFlagship', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/platform/merchants/${merchantProfileId}`)
      .set('Authorization', `Bearer ${platformToken}`)
      .expect(200);

    expect(res.body).toMatchObject({
      storePublished: true,
      isFlagship: false,
    });
  });

  it('PATCH store-settings sets flagship and clears other flagships', async () => {
    const other = await prisma._seedApprovedTenant('flagship-b', 'Flagship B');
    const otherProfile = await prisma.merchantProfile.findUnique({
      where: { tenantId: other.id },
    });
    await prisma.merchantProfile.update({
      where: { id: otherProfile!.id },
      data: { isFlagship: true },
    });

    const res = await request(app.getHttpServer())
      .patch(`/api/v1/platform/merchants/${merchantProfileId}/store-settings`)
      .set('Authorization', `Bearer ${platformToken}`)
      .send({ isFlagship: true, storePublished: true })
      .expect(200);

    expect(res.body.isFlagship).toBe(true);
    expect(res.body.storePublished).toBe(true);

    const otherAfter = await prisma.merchantProfile.findUnique({
      where: { id: otherProfile!.id },
    });
    expect(otherAfter?.isFlagship).toBe(false);
  });

  it('rejects flagship when store is unpublished', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/platform/merchants/${merchantProfileId}/store-settings`)
      .set('Authorization', `Bearer ${platformToken}`)
      .send({ storePublished: false, isFlagship: true })
      .expect(400);
  });

  it('rejects store settings for non-approved merchants', async () => {
    const pendingTenant = await prisma.tenant.create({ data: { slug: 'pending-store' } });
    const pendingProfile = await prisma.merchantProfile.create({
      data: {
        tenantId: pendingTenant.id,
        businessName: 'Pending Store',
        contactEmail: 'pending@store.test',
        onboardingStatus: OnboardingStatus.SUBMITTED,
      },
    });

    await request(app.getHttpServer())
      .patch(`/api/v1/platform/merchants/${pendingProfile.id}/store-settings`)
      .set('Authorization', `Bearer ${platformToken}`)
      .send({ storePublished: true })
      .expect(400);
  });
});
