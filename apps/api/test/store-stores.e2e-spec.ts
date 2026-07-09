import { INestApplication } from '@nestjs/common';
import { OnboardingStatus } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './helpers/create-test-app';
import { MockPrisma } from './helpers/mock-prisma';

describe('Store published list (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;

  beforeEach(async () => {
    ({ app, prisma } = await createTestApp());
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /store/stores excludes flagship from branch picker list', async () => {
    const flagship = await prisma._seedApprovedTenant(
      'flagship-shop',
      'Flagship Shop',
    );
    await prisma.merchantProfile.update({
      where: { tenantId: flagship.id },
      data: { isFlagship: true, storePublished: true },
    });
    const branch = await prisma._seedApprovedTenant('other-shop', 'Other Shop');
    await prisma.merchantProfile.update({
      where: { tenantId: branch.id },
      data: { storePublished: true, isFlagship: false },
    });

    const res = await request(app.getHttpServer())
      .get('/api/v1/store/stores')
      .expect(200);

    const slugs = res.body.items.map((s: { slug: string }) => s.slug);
    expect(slugs).toContain('other-shop');
    expect(slugs).not.toContain('flagship-shop');
    expect(res.body.items[0].displayName).toBe('Other Shop');
  });

  it('GET /store/stores returns APPROVED branch tenants only', async () => {
    const approved = await prisma._seedApprovedTenant('demo-shop', 'Demo Shop');
    await prisma.merchantProfile.update({
      where: { tenantId: approved.id },
      data: { storePublished: true, isFlagship: false },
    });
    const pendingTenant = await prisma.tenant.create({
      data: { slug: 'pending-shop' },
    });
    await prisma.merchantProfile.create({
      data: {
        tenantId: pendingTenant.id,
        businessName: 'Pending Shop',
        contactEmail: 'pending@shop.test',
        onboardingStatus: OnboardingStatus.SUBMITTED,
      },
    });

    const res = await request(app.getHttpServer())
      .get('/api/v1/store/stores')
      .expect(200);

    expect(Array.isArray(res.body.items)).toBe(true);
    const slugs = res.body.items.map((s: { slug: string }) => s.slug);
    expect(slugs).toContain(approved.slug);
    expect(slugs).not.toContain('pending-shop');
    expect(res.body.items[0]).toMatchObject({
      slug: expect.any(String),
      displayName: expect.any(String),
    });
  });
});
