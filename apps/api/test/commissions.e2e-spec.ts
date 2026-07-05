import { INestApplication } from '@nestjs/common';
import {
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
      tenantId: null,
      name: 'Alpha Partner',
      commissionRate: new Prisma.Decimal(10),
      commissionType: CommissionType.PERCENT,
    },
  });

  const distributorB = await prisma.distributor.create({
    data: {
      tenantId: null,
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

    const order = await prisma.order.create({
      data: {
        tenantId,
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
      .get('/api/v1/merchant/commissions')
      .set('Authorization', `Bearer ${staffToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get('/api/v1/merchant/commissions/summary')
      .set('Authorization', `Bearer ${staffToken}`)
      .expect(200);
  });

  it('rejects invalid date range', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/merchant/commissions')
      .query({ from: '2025-06-30', to: '2025-06-01' })
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(400);
  });
});
