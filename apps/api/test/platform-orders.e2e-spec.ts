import { INestApplication } from '@nestjs/common';
import {
  CommissionType,
  FulfillmentType,
  LedgerStatus,
  Prisma,
} from '@prisma/client';
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

describe('Platform orders (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;
  let platformToken: string;
  let tenantId: string;
  let distributorId: string;
  let orderId: string;

  beforeEach(async () => {
    ({ app, prisma } = await createTestApp());
    const hash = await bcrypt.hash('admin123', 10);
    await prisma._seedPlatformAdmin('admin@meridian.test', hash, 'SUPER_ADMIN');
    platformToken = await loginPlatform(app);

    const password = await bcrypt.hash('secret12', 10);
    const { tenant } = await prisma._seedMerchantOwner(
      'orders-branch',
      'Orders Branch',
      'owner@orders.test',
      password,
    );
    tenantId = tenant.id;

    const distributor = await prisma.distributor.create({
      data: {
        tenantId: null,
        name: 'Attributed Promoter',
        email: 'promoter@orders.test',
        commissionRate: new Prisma.Decimal(10),
        commissionType: CommissionType.PERCENT,
        isActive: true,
        portalEnabled: false,
      },
    });
    distributorId = distributor.id;

    const order = await prisma.order.create({
      data: {
        tenantId,
        distributorId,
        status: 'PAID',
        fulfillmentType: FulfillmentType.DELIVERY,
        guestEmail: 'buyer@orders.test',
        subtotal: new Prisma.Decimal(50),
        tax: new Prisma.Decimal(0),
        total: new Prisma.Decimal(50),
        deliveryAddress: {
          name: 'Buyer',
          phone: '13800000000',
          line1: '1 Test St',
          city: 'Shanghai',
          postalCode: '200000',
        },
        lines: {
          create: [
            {
              productName: 'Widget',
              variantName: 'Default',
              quantity: 1,
              unitPrice: new Prisma.Decimal(50),
              unitWholesalePrice: new Prisma.Decimal(30),
              lineTotal: new Prisma.Decimal(50),
            },
          ],
        },
      },
    });
    orderId = order.id;

    await prisma.commissionLedger.create({
      data: {
        tenantId,
        orderId: order.id,
        distributorId,
        amount: new Prisma.Decimal(5),
        status: LedgerStatus.ACCRUED,
        customerOrderSequence: 1,
      },
    });
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /platform/orders includes distributor when set', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/platform/orders')
      .set('Authorization', `Bearer ${platformToken}`)
      .expect(200);

    expect(res.body.meta).toMatchObject({ page: 1, limit: 20 });
    expect(res.body.meta.total).toBeGreaterThanOrEqual(1);

    const row = res.body.data.find((o: { id: string }) => o.id === orderId);
    expect(row).toBeDefined();
    expect(row.distributor).toEqual({
      id: distributorId,
      name: 'Attributed Promoter',
    });
  });

  it('GET /platform/orders filters by guestEmail and tenantId', async () => {
    const byEmail = await request(app.getHttpServer())
      .get('/api/v1/platform/orders')
      .query({ guestEmail: 'buyer@orders' })
      .set('Authorization', `Bearer ${platformToken}`)
      .expect(200);

    expect(
      byEmail.body.data.some((o: { id: string }) => o.id === orderId),
    ).toBe(true);

    const byTenant = await request(app.getHttpServer())
      .get('/api/v1/platform/orders')
      .query({ tenantId })
      .set('Authorization', `Bearer ${platformToken}`)
      .expect(200);

    expect(
      byTenant.body.data.every(
        (o: { tenantId: string }) => o.tenantId === tenantId,
      ),
    ).toBe(true);
  });

  it('GET /platform/orders/:id returns admin detail fields', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/platform/orders/${orderId}`)
      .set('Authorization', `Bearer ${platformToken}`)
      .expect(200);

    expect(res.body).toMatchObject({
      id: orderId,
      tenantId,
      guestEmail: 'buyer@orders.test',
      pickupVerifiedAt: null,
      shippedAt: null,
      distributor: { id: distributorId, name: 'Attributed Promoter' },
    });
    expect(res.body.lines).toHaveLength(1);
    expect(res.body.lines[0]).toMatchObject({
      productName: 'Widget',
      quantity: 1,
      unitPrice: '50',
      unitWholesalePrice: '30',
      lineTotal: '50',
    });
  });
});
