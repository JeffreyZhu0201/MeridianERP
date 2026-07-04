import { INestApplication } from '@nestjs/common';
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

describe('Flagship catalog (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;
  let platformToken: string;

  beforeEach(async () => {
    ({ app, prisma } = await createTestApp());
    const hash = await bcrypt.hash('admin123', 10);
    await prisma._seedPlatformAdmin('admin@meridian.test', hash, 'SUPER_ADMIN');
    platformToken = await loginPlatform(app);
    await prisma._seedFlagshipCatalog({
      flagshipSlug: 'flagship-hq',
      branchSlug: 'branch-east',
      sku: {
        skuCode: 'TEA-001',
        name: 'Jasmine Tea',
        wholesalePrice: 20,
        retailPrice: 35,
        flagshipPrice: 32,
        branchInventory: 8,
      },
    });
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST master-skus creates SKU with flagshipPrice and syncs to flagship tenant', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/platform/allocations/master-skus')
      .set('Authorization', `Bearer ${platformToken}`)
      .send({
        skuCode: 'MUG-100',
        name: 'Ceramic Mug',
        quantityOnHand: 50,
        unitCost: 8,
        wholesalePrice: 15,
        retailPrice: 28,
        flagshipPrice: 25,
      })
      .expect(201);

    expect(created.body.flagshipPrice).toBeDefined();

    const catalog = await request(app.getHttpServer())
      .get('/api/v1/platform/flagship-catalog')
      .set('Authorization', `Bearer ${platformToken}`)
      .expect(200);

    const row = catalog.body.find(
      (r: { skuCode: string }) => r.skuCode === 'MUG-100',
    );
    expect(row).toMatchObject({
      synced: true,
      flagshipPrice: expect.anything(),
    });
  });

  it('POST /platform/flagship-catalog/sync syncs all active master SKUs', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/platform/flagship-catalog/sync')
      .set('Authorization', `Bearer ${platformToken}`)
      .expect(200);

    expect(res.body.synced).toBeGreaterThanOrEqual(1);
  });
});
