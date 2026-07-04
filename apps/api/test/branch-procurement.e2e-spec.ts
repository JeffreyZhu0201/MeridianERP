import { INestApplication } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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

async function loginPlatform(app: INestApplication<App>) {
  const res = await request(app.getHttpServer())
    .post('/api/v1/platform/auth/login')
    .send({ email: 'admin@meridian.test', password: 'secret12' });
  return res.body.accessToken as string;
}

describe('BranchProcurement (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;
  let merchantToken: string;
  let platformToken: string;
  let masterSkuId: string;

  beforeEach(async () => {
    ({ app, prisma } = await createTestApp());
    const password = await bcrypt.hash('secret12', 10);
    await prisma._seedPlatformAdmin('admin@meridian.test', password, 'SUPER_ADMIN');
    await prisma._seedMerchantOwner(
      'branch-store',
      'Branch Store',
      'owner@branch.test',
      password,
    );

    merchantToken = await loginMerchant(app, 'owner@branch.test', 'secret12');
    platformToken = await loginPlatform(app);

    const sku = await prisma.masterSku.create({
      data: {
        skuCode: 'HQ-001',
        name: 'HQ Widget',
        quantityOnHand: 100,
        unitCost: new Prisma.Decimal(20),
        wholesalePrice: new Prisma.Decimal(30),
        retailPrice: new Prisma.Decimal(50),
        flagshipPrice: new Prisma.Decimal(45),
        isActive: true,
      },
    });
    masterSkuId = sku.id;
  });

  afterEach(async () => {
    await app.close();
  });

  it('should complete branch procurement flow: order, pay, ship, receive', async () => {
    const address = await request(app.getHttpServer())
      .post('/api/v1/merchant/settings/procurement-addresses')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        label: '门店前台',
        contactName: '张经理',
        contactPhone: '13800138000',
        address: '上海市浦东新区示例路 100 号',
        isDefault: true,
      })
      .expect(201);

    const created = await request(app.getHttpServer())
      .post('/api/v1/merchant/procurement/orders')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        note: 'Restock shelves',
        receivingAddressId: address.body.id,
        lines: [{ masterSkuId, quantity: 5 }],
      })
      .expect(201);

    expect(created.body.status).toBe('PENDING_PAYMENT');
    expect(created.body.orderNumber).toMatch(/^BP-/);
    expect(Number(created.body.totalAmount)).toBe(150);
    expect(created.body.receivingAddress?.label).toBe('门店前台');

    const paid = await request(app.getHttpServer())
      .post(`/api/v1/merchant/procurement/orders/${created.body.id}/pay`)
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    expect(paid.body.status).toBe('PROCESSING');
    expect(paid.body.payment?.status).toBe('SUCCEEDED');

    const shipped = await request(app.getHttpServer())
      .post(`/api/v1/platform/procurement/orders/${created.body.id}/ship`)
      .set('Authorization', `Bearer ${platformToken}`)
      .expect(200);

    expect(shipped.body.status).toBe('SHIPPED');

    const received = await request(app.getHttpServer())
      .post(
        `/api/v1/merchant/procurement/orders/${created.body.id}/confirm-receipt`,
      )
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    expect(received.body.status).toBe('RECEIVED');
    expect(received.body.lines[0].quantityReceived).toBe(5);

    const levels = await request(app.getHttpServer())
      .get('/api/v1/merchant/inventory/stock-levels')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    const onHand = levels.body.data.reduce(
      (sum: number, row: { quantityOnHand: number }) => sum + row.quantityOnHand,
      0,
    );
    expect(onHand).toBeGreaterThanOrEqual(5);
  });
});
