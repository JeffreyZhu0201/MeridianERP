import { INestApplication } from '@nestjs/common';
import {
  BindType,
  CommissionType,
  LedgerStatus,
  OnboardingStatus,
  OrderStatus,
  Prisma,
} from '@prisma/client';
import { DEFAULT_COMMISSION_WINDOW_DAYS } from '@meridian/shared';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './helpers/create-test-app';
import { MockPrisma } from './helpers/mock-prisma';

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

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
    await request(app.getHttpServer()).get('/api/v1/platform/dashboard').expect(401);
  });

  it('returns live cross-tenant dashboard metrics', async () => {
    const tenantA = await prisma._seedApprovedTenant('tenant-a', 'Tenant A Corp');
    const tenantB = await prisma._seedApprovedTenant('tenant-b', 'Tenant B Corp');

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
        tenantId: tenantA.id,
        name: 'Active One',
        commissionRate: new Prisma.Decimal(10),
        commissionType: CommissionType.PERCENT,
        isActive: true,
      },
    });
    await prisma.distributor.create({
      data: {
        tenantId: tenantA.id,
        name: 'Active Two',
        commissionRate: new Prisma.Decimal(8),
        commissionType: CommissionType.PERCENT,
        isActive: true,
      },
    });
    await prisma.distributor.create({
      data: {
        tenantId: tenantB.id,
        name: 'Active Three',
        commissionRate: new Prisma.Decimal(5),
        commissionType: CommissionType.PERCENT,
        isActive: true,
      },
    });
    await prisma.distributor.create({
      data: {
        tenantId: tenantB.id,
        name: 'Inactive',
        commissionRate: new Prisma.Decimal(5),
        commissionType: CommissionType.PERCENT,
        isActive: false,
      },
    });

    await prisma.binding.create({
      data: {
        tenantId: tenantA.id,
        distributorId: activeOne.id,
        bindableType: BindType.MERCHANT,
        bindableId: tenantA.id,
        boundAt: daysAgo(5),
      },
    });
    await prisma.binding.create({
      data: {
        tenantId: tenantB.id,
        distributorId: activeOne.id,
        bindableType: BindType.CUSTOMER,
        bindableId: 'customer-old',
        boundAt: daysAgo(DEFAULT_COMMISSION_WINDOW_DAYS + 5),
      },
    });

    const inWindowOrder = await prisma.order.create({
      data: {
        tenantId: tenantA.id,
        distributorId: activeOne.id,
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
        distributorId: activeOne.id,
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
        distributorId: activeOne.id,
        status: OrderStatus.PAID,
        subtotal: new Prisma.Decimal(20),
        tax: new Prisma.Decimal(0),
        total: new Prisma.Decimal(20),
        createdAt: daysAgo(DEFAULT_COMMISSION_WINDOW_DAYS + 10),
      },
    });
    await prisma.commissionLedger.create({
      data: {
        tenantId: tenantA.id,
        orderId: oldOrder.id,
        distributorId: activeOne.id,
        amount: new Prisma.Decimal(50),
        status: LedgerStatus.ACCRUED,
        createdAt: daysAgo(DEFAULT_COMMISSION_WINDOW_DAYS + 10),
      },
    });

    const res = await request(app.getHttpServer())
      .get('/api/v1/platform/dashboard')
      .set('Authorization', `Bearer ${platformToken}`)
      .expect(200);

    expect(res.body.totalMerchants).toBe(3);
    expect(res.body.pendingReview).toBe(1);
    expect(res.body.activeDistributors).toBe(3);
    expect(res.body.bindingsLast30Days).toBe(1);
    expect(res.body.commissionAccruedLast30Days).toBe('12.5');
    expect(res.body.recentMerchants).toHaveLength(3);
    expect(res.body.recentMerchants[0].businessName).toBeDefined();
    expect(res.body.recentMerchants.length).toBeLessThanOrEqual(5);
  });

  it('GET /platform/merchants/:id returns crmSummary and distributor metrics', async () => {
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

    const alpha = await prisma.distributor.create({
      data: {
        tenantId: tenant.id,
        name: 'Alpha Partner',
        commissionRate: new Prisma.Decimal(10),
        commissionType: CommissionType.PERCENT,
      },
    });
    const beta = await prisma.distributor.create({
      data: {
        tenantId: tenant.id,
        name: 'Beta Partner',
        commissionRate: new Prisma.Decimal(5),
        commissionType: CommissionType.PERCENT,
        isActive: false,
      },
    });

    await prisma.binding.create({
      data: {
        tenantId: tenant.id,
        distributorId: alpha.id,
        bindableType: BindType.MERCHANT,
        bindableId: tenant.id,
        boundAt: daysAgo(40),
      },
    });
    await prisma.binding.create({
      data: {
        tenantId: tenant.id,
        distributorId: alpha.id,
        bindableType: BindType.CUSTOMER,
        bindableId: 'cust-1',
        boundAt: daysAgo(10),
      },
    });
    await prisma.binding.create({
      data: {
        tenantId: tenant.id,
        distributorId: beta.id,
        bindableType: BindType.CUSTOMER,
        bindableId: 'cust-2',
        boundAt: daysAgo(5),
      },
    });

    await prisma.order.create({
      data: {
        tenantId: tenant.id,
        distributorId: alpha.id,
        status: OrderStatus.PAID,
        subtotal: new Prisma.Decimal(80),
        tax: new Prisma.Decimal(0),
        total: new Prisma.Decimal(80),
        createdAt: daysAgo(7),
      },
    });
    await prisma.order.create({
      data: {
        tenantId: tenant.id,
        distributorId: alpha.id,
        status: OrderStatus.PAID,
        subtotal: new Prisma.Decimal(20),
        tax: new Prisma.Decimal(0),
        total: new Prisma.Decimal(20),
        createdAt: daysAgo(45),
      },
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
    expect(res.body.distributors).toHaveLength(2);
    expect(res.body.distributors[0]).toMatchObject({
      id: alpha.id,
      name: 'Alpha Partner',
      isActive: true,
      bindingCount: 2,
      bindingsLast30Days: 1,
      attributedOrdersLast30Days: 1,
    });
    expect(res.body.distributors[1]).toMatchObject({
      id: beta.id,
      name: 'Beta Partner',
      isActive: false,
      bindingCount: 1,
      bindingsLast30Days: 1,
      attributedOrdersLast30Days: 0,
    });
    expect(res.body.tenant).toBeUndefined();
    expect(res.body.businessName).toBe('Metrics Corp');
  });

  it('GET /platform/merchants/:id returns empty distributors with crmSummary', async () => {
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

    expect(res.body.distributors).toEqual([]);
    expect(res.body.crmSummary).toEqual({
      contacts: 0,
      companies: 1,
      leads: 0,
    });
  });
});
