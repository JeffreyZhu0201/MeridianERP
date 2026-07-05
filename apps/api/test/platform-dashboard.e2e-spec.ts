import { INestApplication } from '@nestjs/common';
import {
  CommissionType,
  LedgerStatus,
  OnboardingStatus,
  OrderStatus,
  Prisma,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './helpers/create-test-app';
import { MockPrisma } from './helpers/mock-prisma';

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

const DASHBOARD_WINDOW_DAYS = 30;

async function loginPlatform(
  app: INestApplication<App>,
  email = 'admin@meridian.test',
  password = 'admin123',
) {
  const res = await request(app.getHttpServer())
    .post('/api/v1/platform/auth/login')
    .send({ email, password });
  return res.body.accessToken as string;
}

describe('Platform dashboard (e2e)', () => {
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

  it('GET /platform/dashboard returns 401 without platform token', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/platform/dashboard')
      .expect(401);
  });

  it('returns live cross-tenant dashboard metrics', async () => {
    const tenantA = await prisma._seedApprovedTenant(
      'tenant-a',
      'Tenant A Corp',
    );
    const tenantB = await prisma._seedApprovedTenant(
      'tenant-b',
      'Tenant B Corp',
    );

    await prisma.merchantProfile.create({
      data: {
        tenantId: tenantA.id,
        businessName: 'Pending Merchant',
        contactEmail: 'pending@merchant.test',
        onboardingStatus: OnboardingStatus.SUBMITTED,
        submittedAt: new Date(),
      },
    });

    const activeOne = await prisma.distributor.create({
      data: {
        tenantId: null,
        name: 'Active One',
        commissionRate: new Prisma.Decimal(10),
        commissionType: CommissionType.PERCENT,
        isActive: true,
      },
    });
    await prisma.distributor.create({
      data: {
        tenantId: null,
        name: 'Active Two',
        commissionRate: new Prisma.Decimal(8),
        commissionType: CommissionType.PERCENT,
        isActive: true,
      },
    });
    await prisma.distributor.create({
      data: {
        tenantId: null,
        name: 'Active Three',
        commissionRate: new Prisma.Decimal(5),
        commissionType: CommissionType.PERCENT,
        isActive: true,
      },
    });
    await prisma.distributor.create({
      data: {
        tenantId: null,
        name: 'Inactive',
        commissionRate: new Prisma.Decimal(5),
        commissionType: CommissionType.PERCENT,
        isActive: false,
      },
    });

    const inWindowOrder = await prisma.order.create({
      data: {
        tenantId: tenantA.id,
        status: OrderStatus.PAID,
        subtotal: new Prisma.Decimal(100),
        tax: new Prisma.Decimal(0),
        total: new Prisma.Decimal(100),
        createdAt: daysAgo(3),
      },
    });
    await prisma.commissionLedger.create({
      data: {
        tenantId: tenantA.id,
        orderId: inWindowOrder.id,
        distributorId: activeOne.id,
        amount: new Prisma.Decimal(12.5),
        status: LedgerStatus.ACCRUED,
        createdAt: daysAgo(3),
      },
    });

    const settledOrder = await prisma.order.create({
      data: {
        tenantId: tenantA.id,
        status: OrderStatus.PAID,
        subtotal: new Prisma.Decimal(50),
        tax: new Prisma.Decimal(0),
        total: new Prisma.Decimal(50),
        createdAt: daysAgo(2),
      },
    });
    await prisma.commissionLedger.create({
      data: {
        tenantId: tenantA.id,
        orderId: settledOrder.id,
        distributorId: activeOne.id,
        amount: new Prisma.Decimal(99),
        status: LedgerStatus.SETTLED,
        createdAt: daysAgo(2),
      },
    });

    const oldOrder = await prisma.order.create({
      data: {
        tenantId: tenantA.id,
        status: OrderStatus.PAID,
        subtotal: new Prisma.Decimal(20),
        tax: new Prisma.Decimal(0),
        total: new Prisma.Decimal(20),
        createdAt: daysAgo(DASHBOARD_WINDOW_DAYS + 10),
      },
    });
    await prisma.commissionLedger.create({
      data: {
        tenantId: tenantA.id,
        orderId: oldOrder.id,
        distributorId: activeOne.id,
        amount: new Prisma.Decimal(50),
        status: LedgerStatus.ACCRUED,
        createdAt: daysAgo(DASHBOARD_WINDOW_DAYS + 10),
      },
    });

    const res = await request(app.getHttpServer())
      .get('/api/v1/platform/dashboard')
      .set('Authorization', `Bearer ${platformToken}`)
      .expect(200);

    expect(res.body.totalMerchants).toBe(3);
    expect(res.body.pendingReview).toBe(1);
    expect(res.body.activeDistributors).toBe(3);
    expect(res.body.commissionAccruedLast30Days).toBe('12.5');
    expect(res.body.commissionSettledLast30Days).toBe('99');
    expect(res.body.ordersLast30Days).toBe(2);
    expect(res.body.orderRevenueLast30Days).toBe('150');
    expect(Array.isArray(res.body.trend)).toBe(true);
    expect(res.body.trend.length).toBeGreaterThan(0);
    expect(res.body.recentMerchants).toHaveLength(3);
    expect(res.body.recentMerchants[0].businessName).toBeDefined();
    expect(res.body.recentMerchants.length).toBeLessThanOrEqual(5);
  });

  it('GET /platform/merchants/:id returns crmSummary', async () => {
    const { tenant } = await prisma._seedMerchantOwner(
      'metrics-corp',
      'Metrics Corp',
      'owner@metrics.test',
      await bcrypt.hash('secret12', 10),
    );
    const profile = await prisma.merchantProfile.findUnique({
      where: { tenantId: tenant.id },
    });
    expect(profile).toBeTruthy();

    await prisma.crmContact.create({
      data: {
        tenantId: tenant.id,
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@metrics.test',
      },
    });
    await prisma.crmContact.create({
      data: {
        tenantId: tenant.id,
        firstName: 'Grace',
        lastName: 'Hopper',
        email: 'grace@metrics.test',
      },
    });
    await prisma.crmCompany.create({
      data: { tenantId: tenant.id, name: 'Metrics LLC' },
    });
    await prisma.crmLead.create({
      data: { tenantId: tenant.id, title: 'Enterprise deal' },
    });
    await prisma.crmLead.create({
      data: { tenantId: tenant.id, title: 'SMB deal' },
    });
    await prisma.crmLead.create({
      data: { tenantId: tenant.id, title: 'Partner intro' },
    });

    const res = await request(app.getHttpServer())
      .get(`/api/v1/platform/merchants/${profile!.id}`)
      .set('Authorization', `Bearer ${platformToken}`)
      .expect(200);

    expect(res.body.crmSummary).toEqual({
      contacts: 2,
      companies: 1,
      leads: 3,
    });
    expect(res.body.distributors).toBeUndefined();
    expect(res.body.tenant).toBeUndefined();
    expect(res.body.businessName).toBe('Metrics Corp');
  });

  it('GET /platform/merchants/:id returns crmSummary without distributor list', async () => {
    const { tenant } = await prisma._seedMerchantOwner(
      'empty-dist',
      'Empty Dist Corp',
      'owner@empty.test',
      await bcrypt.hash('secret12', 10),
    );
    const profile = await prisma.merchantProfile.findUnique({
      where: { tenantId: tenant.id },
    });

    await prisma.crmCompany.create({
      data: { tenantId: tenant.id, name: 'Solo Co' },
    });

    const res = await request(app.getHttpServer())
      .get(`/api/v1/platform/merchants/${profile!.id}`)
      .set('Authorization', `Bearer ${platformToken}`)
      .expect(200);

    expect(res.body.distributors).toBeUndefined();
    expect(res.body.crmSummary).toEqual({
      contacts: 0,
      companies: 1,
      leads: 0,
    });
  });
});
