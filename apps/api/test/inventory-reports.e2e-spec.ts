import { INestApplication } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { StockAdjustmentReason } from '@prisma/client';
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

describe('InventoryReports (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;
  let merchantToken: string;
  let warehouseId: string;
  let variantId: string;

  beforeEach(async () => {
    ({ app, prisma } = await createTestApp());
    const password = await bcrypt.hash('secret12', 10);
    await prisma._seedMerchantOwner('acme-store', 'Acme Store', 'owner@acme.test', password);
    merchantToken = await loginMerchant(app, 'owner@acme.test', 'secret12');

    const product = await request(app.getHttpServer())
      .post('/api/v1/merchant/products')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        name: 'Report Widget',
        isPublished: true,
        variants: [{ sku: 'RPT-1', name: 'Default', price: 40, inventory: 30 }],
      })
      .expect(201);

    variantId = product.body.variants[0].id;

    const warehouses = await request(app.getHttpServer())
      .get('/api/v1/merchant/inventory/warehouses')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    warehouseId = warehouses.body.find((w: { isDefault: boolean }) => w.isDefault).id;

    await request(app.getHttpServer())
      .post('/api/v1/merchant/inventory/adjustments')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        warehouseId,
        variantId,
        quantityDelta: -5,
        reason: StockAdjustmentReason.COUNT_CORRECTION,
        note: 'Cycle count',
      })
      .expect(201);
  });

  afterEach(async () => {
    await app.close();
  });

  it('should return current stock by variant and warehouse (US-3.7)', async () => {
    const report = await request(app.getHttpServer())
      .get('/api/v1/merchant/inventory/reports/stock')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    expect(report.body.data.length).toBeGreaterThan(0);
    const row = report.body.data.find((sl: { variant: { id: string } }) => sl.variant.id === variantId);
    expect(row).toBeDefined();
    expect(row.quantityOnHand).toBe(25);
    expect(row.warehouse).toBeDefined();
  });

  it('should return adjustment history with reason and actor (US-3.7)', async () => {
    const report = await request(app.getHttpServer())
      .get('/api/v1/merchant/inventory/reports/adjustments')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    expect(report.body.data.length).toBeGreaterThan(0);
    const adj = report.body.data.find((a: { variantId: string }) => a.variantId === variantId);
    expect(adj).toMatchObject({
      quantityDelta: -5,
      reason: StockAdjustmentReason.COUNT_CORRECTION,
    });
    expect(adj.actor).toBeDefined();
  });

  it('should export stock and adjustments as CSV (US-3.7 P1)', async () => {
    const stockCsv = await request(app.getHttpServer())
      .get('/api/v1/merchant/inventory/reports/export/stock')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    expect(stockCsv.headers['content-type']).toMatch(/text\/csv/);
    expect(stockCsv.text).toContain('warehouse,sku');
    expect(stockCsv.text).toContain('RPT-1');

    const adjCsv = await request(app.getHttpServer())
      .get('/api/v1/merchant/inventory/reports/export/adjustments')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    expect(adjCsv.headers['content-type']).toMatch(/text\/csv/);
    expect(adjCsv.text).toContain('COUNT_CORRECTION');
  });
});
