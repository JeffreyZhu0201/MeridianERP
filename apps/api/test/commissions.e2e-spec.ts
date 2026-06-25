import { INestApplication } from '@nestjs/common';
import {
  BindType,
  CommissionType,
  LedgerStatus,
  OrderStatus,
  Prisma,
} from '@prisma/client';
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

async function setupMerchantWithDistributor(
  app: INestApplication<App>,
  prisma: MockPrisma,
) {
  const password = await bcrypt.hash('secret12', 10);
  const { tenant } = await prisma._seedMerchantOwner(
    'commission-corp',
    'Commission Corp',
    'owner@commission.test',
    password,
  );
  const merchantToken = await loginMerchant(
    app,
    'owner@commission.test',
    'secret12',
  );

  const distributor = await prisma.distributor.create({
    data: {
      tenantId: tenant.id,
      name: 'Alpha Partner',
      commissionRate: new Prisma.Decimal(10),
      commissionType: CommissionType.PERCENT,
    },
  });

  const distributorB = await prisma.distributor.create({
    data: {
      tenantId: tenant.id,
      name: 'Beta Partner',
      commissionRate: new Prisma.Decimal(5),
      commissionType: CommissionType.PERCENT,
    },
  });

  return {
    merchantToken,
    tenantId: tenant.id,
    distributorId: distributor.id,
    distributorBId: distributorB.id,
  };
}

describe('Commissions visibility (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;
  let merchantToken: string;
  let tenantId: string;
  let distributorId: string;
  let distributorBId: string;
  let orderId: string;
  let settledLedgerId: string;

  beforeEach(async () => {
    ({ app, prisma } = await createTestApp());
    ({ merchantToken, tenantId, distributorId, distributorBId } =
      await setupMerchantWithDistributor(app, prisma));

    await prisma.binding.create({
      data: {
        tenantId,
        distributorId,
        bindableType: BindType.MERCHANT,
        bindableId: tenantId,
      },
    });
    await prisma.binding.create({
      data: {
        tenantId,
        distributorId,
        bindableType: BindType.CUSTOMER,
        bindableId: 'customer-bind-1',
      },
    });

    const order = await prisma.order.create({
      data: {
        tenantId,
        distributorId,
        status: OrderStatus.PAID,
        subtotal: new Prisma.Decimal(100),
        tax: new Prisma.Decimal(0),
        total: new Prisma.Decimal(100),
      },
    });
    orderId = order.id;

    await prisma.commissionLedger.create({
      data: {
        tenantId,
        orderId,
        distributorId,
        amount: new Prisma.Decimal(10),
        status: LedgerStatus.ACCRUED,
      },
    });

    const settledOrder = await prisma.order.create({
      data: {
        tenantId,
        distributorId,
        status: OrderStatus.PAID,
        subtotal: new Prisma.Decimal(200),
        tax: new Prisma.Decimal(0),
        total: new Prisma.Decimal(200),
      },
    });

    const batch = await prisma.settlementBatch.create({
      data: {
        periodStart: new Date('2025-06-01T00:00:00.000Z'),
        periodEnd: new Date('2025-06-30T23:59:59.999Z'),
        status: 'EXPORTED',
      },
    });

    const settled = await prisma.commissionLedger.create({
      data: {
        tenantId,
        orderId: settledOrder.id,
        distributorId,
        amount: new Prisma.Decimal(20),
        status: LedgerStatus.SETTLED,
      },
    });
    settledLedgerId = settled.id;
    await prisma.commissionLedger.updateMany({
      where: { id: { in: [settled.id] } },
      data: { settlementBatchId: batch.id },
    });

    await prisma.commissionLedger.create({
      data: {
        tenantId,
        orderId: (
          await prisma.order.create({
            data: {
              tenantId,
              distributorId: distributorBId,
              status: OrderStatus.PAID,
              subtotal: new Prisma.Decimal(50),
              tax: new Prisma.Decimal(0),
              total: new Prisma.Decimal(50),
            },
          })
        ).id,
        distributorId: distributorBId,
        amount: new Prisma.Decimal(2.5),
        status: LedgerStatus.ACCRUED,
      },
    });
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns performance metrics for seeded PAID order and ledger', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/merchant/distributors/${distributorId}/performance`)
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    expect(res.body).toMatchObject({
      distributorId,
      distributorName: 'Alpha Partner',
      bindingsMerchant: 1,
      bindingsCustomer: 1,
      attributedOrderCount: 2,
      attributedOrderRevenue: '300',
      commissionAccrued: '10',
      commissionSettled: '20',
      commissionTotal: '30',
    });
    expect(res.body.trend.length).toBeGreaterThan(0);
    const today = new Date().toISOString().slice(0, 10);
    const todayBucket = res.body.trend.find(
      (p: { date: string }) => p.date === today,
    );
    expect(todayBucket).toMatchObject({
      orderCount: 2,
      orderRevenue: '300',
      commissionAccrued: '10',
    });
  });

  it('narrows performance metrics when date range excludes activity', async () => {
    const ledgers = await prisma.commissionLedger.findMany({
      where: { tenantId, orderId },
    });
    await prisma.order.update({
      where: { id: orderId },
      data: { createdAt: new Date('2020-01-01T12:00:00.000Z') },
    });
    await prisma.commissionLedger.updateMany({
      where: { id: { in: [ledgers[0].id] } },
      data: { createdAt: new Date('2020-01-01T12:00:00.000Z') },
    });

    const res = await request(app.getHttpServer())
      .get(`/api/v1/merchant/distributors/${distributorId}/performance`)
      .query({ from: '2020-01-01', to: '2020-01-31' })
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    expect(res.body.attributedOrderCount).toBe(1);
    expect(res.body.attributedOrderRevenue).toBe('100');
    expect(res.body.commissionAccrued).toBe('10');
    expect(res.body.commissionSettled).toBe('0');
  });

  it('returns zeros and filled trend for inactive distributor', async () => {
    const inactive = await prisma.distributor.create({
      data: {
        tenantId,
        name: 'Inactive',
        commissionRate: new Prisma.Decimal(5),
        commissionType: CommissionType.PERCENT,
        isActive: false,
      },
    });

    const res = await request(app.getHttpServer())
      .get(`/api/v1/merchant/distributors/${inactive.id}/performance`)
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    expect(res.body).toMatchObject({
      bindingsMerchant: 0,
      bindingsCustomer: 0,
      attributedOrderCount: 0,
      attributedOrderRevenue: '0',
      commissionAccrued: '0',
      commissionSettled: '0',
      commissionTotal: '0',
    });
    expect(res.body.trend.length).toBeGreaterThan(0);
    expect(
      res.body.trend.every(
        (p: { orderCount: number }) => p.orderCount === 0,
      ),
    ).toBe(true);
  });

  it('paginates commission list', async () => {
    const page1 = await request(app.getHttpServer())
      .get('/api/v1/merchant/commissions')
      .query({ page: 1, limit: 2 })
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    expect(page1.body.total).toBe(3);
    expect(page1.body.page).toBe(1);
    expect(page1.body.limit).toBe(2);
    expect(page1.body.items).toHaveLength(2);

    const page2 = await request(app.getHttpServer())
      .get('/api/v1/merchant/commissions')
      .query({ page: 2, limit: 2 })
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    expect(page2.body.items).toHaveLength(1);
  });

  it('filters commission list by distributorId', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/merchant/commissions')
      .query({ distributorId })
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    expect(res.body.total).toBe(2);
    expect(
      res.body.items.every(
        (row: { distributorId: string }) => row.distributorId === distributorId,
      ),
    ).toBe(true);
  });

  it('returns SETTLED rows with settlement batch period', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/merchant/commissions')
      .query({ status: 'SETTLED' })
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    expect(res.body.total).toBe(1);
    const row = res.body.items[0];
    expect(row.id).toBe(settledLedgerId);
    expect(row.settlementBatchPeriod).toBe('2025-06-01 — 2025-06-30');
    expect(row.orderReference).toBeTruthy();
  });

  it('returns summary totals matching accrued + settled', async () => {
    const summary = await request(app.getHttpServer())
      .get('/api/v1/merchant/commissions/summary')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    expect(summary.body.entryCount).toBe(3);
    expect(summary.body.accruedTotal).toBe('12.5');
    expect(summary.body.settledTotal).toBe('20');
    expect(summary.body.totalCommission).toBe('32.5');

    const filtered = await request(app.getHttpServer())
      .get('/api/v1/merchant/commissions/summary')
      .query({ distributorId })
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    expect(filtered.body.entryCount).toBe(2);
    expect(filtered.body.totalCommission).toBe('30');
  });

  it('allows MERCHANT_STAFF read access on all endpoints', async () => {
    const hash = await bcrypt.hash('staff123', 10);
    await prisma.user.create({
      data: {
        tenantId,
        email: 'staff@commission.test',
        password: hash,
        role: 'MERCHANT_STAFF',
      },
    });
    const login = await request(app.getHttpServer())
      .post('/api/v1/merchant/auth/login')
      .send({ email: 'staff@commission.test', password: 'staff123' });
    const staffToken = login.body.accessToken as string;

    await request(app.getHttpServer())
      .get(`/api/v1/merchant/distributors/${distributorId}/performance`)
      .set('Authorization', `Bearer ${staffToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get('/api/v1/merchant/commissions')
      .set('Authorization', `Bearer ${staffToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get('/api/v1/merchant/commissions/summary')
      .set('Authorization', `Bearer ${staffToken}`)
      .expect(200);
  });

  it('returns 404 for distributor outside tenant', async () => {
    const other = await prisma._seedApprovedTenant('other-corp', 'Other Corp');
    const foreign = await prisma.distributor.create({
      data: {
        tenantId: other.id,
        name: 'Foreign',
        commissionRate: new Prisma.Decimal(5),
        commissionType: CommissionType.PERCENT,
      },
    });

    await request(app.getHttpServer())
      .get(`/api/v1/merchant/distributors/${foreign.id}/performance`)
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(404);
  });

  it('rejects invalid date range', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/merchant/commissions')
      .query({ from: '2025-06-30', to: '2025-06-01' })
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(400);
  });
});
