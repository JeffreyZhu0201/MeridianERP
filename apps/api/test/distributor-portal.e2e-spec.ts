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

describe('Distributor portal (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;
  let merchantToken: string;
  let tenantId: string;
  let tenantSlug: string;
  let distributorId: string;

  beforeEach(async () => {
    ({ app, prisma } = await createTestApp());

    const password = await bcrypt.hash('secret12', 10);
    const { tenant } = await prisma._seedMerchantOwner(
      'portal-corp',
      'Portal Corp',
      'owner@portal.test',
      password,
    );
    tenantId = tenant.id;
    tenantSlug = tenant.slug;
    merchantToken = await loginMerchant(app, 'owner@portal.test', 'secret12');

    const distributor = await prisma.distributor.create({
      data: {
        tenantId,
        name: 'Portal Partner',
        email: 'partner@portal.test',
        commissionRate: new Prisma.Decimal(10),
        commissionType: CommissionType.PERCENT,
      },
    });
    distributorId = distributor.id;

    await request(app.getHttpServer())
      .post(`/api/v1/merchant/distributors/${distributorId}/portal`)
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({ password: 'portalpass1' })
      .expect(200);

    await prisma.binding.create({
      data: {
        tenantId,
        distributorId,
        bindableType: BindType.CUSTOMER,
        bindableId: 'cust-1',
      },
    });

    const order = await prisma.order.create({
      data: {
        tenantId,
        distributorId,
        status: OrderStatus.PAID,
        subtotal: new Prisma.Decimal(50),
        tax: new Prisma.Decimal(0),
        total: new Prisma.Decimal(50),
      },
    });

    await prisma.commissionLedger.create({
      data: {
        tenantId,
        orderId: order.id,
        distributorId,
        amount: new Prisma.Decimal(5),
        status: LedgerStatus.ACCRUED,
      },
    });
  });

  it('POST /distributor/auth/login returns JWT', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/distributor/auth/login')
      .send({
        email: 'partner@portal.test',
        password: 'portalpass1',
        tenantSlug,
      })
      .expect(200);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.distributor.id).toBe(distributorId);
    expect(res.body.distributor.tenantSlug).toBe(tenantSlug);
  });

  it('GET /distributor/me/* returns scoped read-only data', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/v1/distributor/auth/login')
      .send({
        email: 'partner@portal.test',
        password: 'portalpass1',
        tenantSlug,
      })
      .expect(200);

    const token = login.body.accessToken as string;

    const dashboard = await request(app.getHttpServer())
      .get('/api/v1/distributor/me/dashboard')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(dashboard.body.distributorId).toBe(distributorId);
    expect(dashboard.body.bindingsCount).toBeGreaterThanOrEqual(1);
    expect(dashboard.body.attributedOrderCount).toBeGreaterThanOrEqual(1);
    expect(dashboard.body.commissionSummary.entryCount).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(dashboard.body.trend)).toBe(true);

    const commissions = await request(app.getHttpServer())
      .get('/api/v1/distributor/me/commissions')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(commissions.body.items.length).toBeGreaterThanOrEqual(1);
    expect(commissions.body.items[0].distributorId).toBe(distributorId);

    const bindings = await request(app.getHttpServer())
      .get('/api/v1/distributor/me/bindings')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(bindings.body.total).toBeGreaterThanOrEqual(1);
    expect(bindings.body.items[0].bindableType).toBe(BindType.CUSTOMER);
  });

  it('rejects portal enable for non-owner', async () => {
    const staffPassword = await bcrypt.hash('staffpass1', 10);
    await prisma.user.create({
      data: {
        tenantId,
        email: 'staff@portal.test',
        password: staffPassword,
        role: 'MERCHANT_STAFF',
      },
    });
    const staffToken = await loginMerchant(app, 'staff@portal.test', 'staffpass1');

    await request(app.getHttpServer())
      .post(`/api/v1/merchant/distributors/${distributorId}/portal`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ password: 'newpass123' })
      .expect(403);
  });
});
