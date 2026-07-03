import { INestApplication } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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

describe('Platform distributors (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;
  let platformToken: string;

  beforeEach(async () => {
    ({ app, prisma } = await createTestApp());
    const hash = await bcrypt.hash('admin123', 10);
    await prisma._seedPlatformAdmin('admin@meridian.test', hash, 'SUPER_ADMIN');
    platformToken = await loginPlatform(app);
  });

  afterEach(async () => {
    await app.close();
  });

  it('creates promoter from store-registered user via accountId', async () => {
    const storePassword = 'storepass1';
    const passwordHash = await bcrypt.hash(storePassword, 10);
    const account = await prisma.platformAccount.create({
      data: {
        email: 'promoter.store@example.com',
        password: passwordHash,
        firstName: 'Store',
        lastName: 'Promoter',
        phone: '13800138000',
      },
    });

    const res = await request(app.getHttpServer())
      .post('/api/v1/platform/distributors')
      .set('Authorization', `Bearer ${platformToken}`)
      .send({ accountId: account.id, commissionRate: 10 })
      .expect(201);

    expect(res.body).toMatchObject({
      id: expect.any(String),
      name: 'Store Promoter',
      email: 'promoter.store@example.com',
      phone: '13800138000',
      accountId: account.id,
      accountEmail: 'promoter.store@example.com',
      commissionRate: 10,
      isActive: true,
      portalEnabled: true,
      recruitedMerchantCount: 0,
      createdAt: expect.any(String),
    });
    expect(res.body.tenantId).toBeUndefined();
  });

  it('promoter can login at distributor auth with store password', async () => {
    const storePassword = 'storepass1';
    const passwordHash = await bcrypt.hash(storePassword, 10);
    const account = await prisma.platformAccount.create({
      data: {
        email: 'login.promoter@example.com',
        password: passwordHash,
        firstName: 'Login',
        lastName: 'Promoter',
      },
    });

    const created = await request(app.getHttpServer())
      .post('/api/v1/platform/distributors')
      .set('Authorization', `Bearer ${platformToken}`)
      .send({ accountId: account.id, commissionRate: 8 })
      .expect(201);

    const login = await request(app.getHttpServer())
      .post('/api/v1/distributor/auth/login')
      .send({
        email: 'login.promoter@example.com',
        password: storePassword,
      })
      .expect(200);

    expect(login.body.accessToken).toBeDefined();
    expect(login.body.distributor).toMatchObject({
      id: created.body.id,
      isPlatformDistributor: true,
    });
  });

  it('getBranches includes allocation stats when allocation exists', async () => {
    const passwordHash = await bcrypt.hash('secret12', 10);
    const { tenant } = await prisma._seedMerchantOwner(
      'alloc-branch',
      'Alloc Branch',
      'owner@alloc.test',
      passwordHash,
    );

    const promoter = await prisma.distributor.create({
      data: {
        tenantId: null,
        name: 'Alloc Promoter',
        email: 'alloc.promoter@test',
        commissionRate: new Prisma.Decimal(10),
        isActive: true,
        portalEnabled: true,
      },
    });

    await prisma.merchantProfile.update({
      where: { tenantId: tenant.id },
      data: { recruitedByDistributorId: promoter.id, recruitedAt: new Date() },
    });

    await prisma._seedConfirmedAllocation({
      tenantId: tenant.id,
      lines: [
        { quantity: 2, wholesalePrice: 25 },
        { quantity: 1, wholesalePrice: 10 },
      ],
    });

    const res = await request(app.getHttpServer())
      .get(`/api/v1/platform/distributors/${promoter.id}/branches`)
      .set('Authorization', `Bearer ${platformToken}`)
      .expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({
      tenantId: tenant.id,
      businessName: 'Alloc Branch',
      allocationOrderCount: 1,
      allocationWholesaleTotal: 60,
      confirmedAllocationCount: 1,
      lastAllocationAt: expect.any(String),
    });
  });

  it('GET branches/:tenantId/allocations returns allocation orders', async () => {
    const passwordHash = await bcrypt.hash('secret12', 10);
    const { tenant } = await prisma._seedMerchantOwner(
      'alloc-list-branch',
      'Alloc List Branch',
      'owner@alloc-list.test',
      passwordHash,
    );

    const promoter = await prisma.distributor.create({
      data: {
        tenantId: null,
        name: 'List Promoter',
        email: 'list.promoter@test',
        commissionRate: new Prisma.Decimal(10),
        isActive: true,
        portalEnabled: true,
      },
    });

    await prisma.merchantProfile.update({
      where: { tenantId: tenant.id },
      data: { recruitedByDistributorId: promoter.id, recruitedAt: new Date() },
    });

    const allocation = await prisma._seedConfirmedAllocation({
      tenantId: tenant.id,
      lines: [{ quantity: 3, wholesalePrice: 20 }],
    });

    const res = await request(app.getHttpServer())
      .get(
        `/api/v1/platform/distributors/${promoter.id}/branches/${tenant.id}/allocations`,
      )
      .set('Authorization', `Bearer ${platformToken}`)
      .expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({
      id: allocation.id,
      status: 'CONFIRMED',
      wholesaleTotal: 60,
      lineCount: 1,
      createdAt: expect.any(String),
    });
  });
});
