import { INestApplication } from '@nestjs/common';
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

describe('InventoryPurchaseOrders (e2e)', () => {
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
        name: 'Widget',
        isPublished: true,
        variants: [{ sku: 'WIDGET-1', name: 'Default', price: 50, inventory: 5 }],
      })
      .expect(201);

    variantId = product.body.variants[0].id;

    const warehouses = await request(app.getHttpServer())
      .get('/api/v1/merchant/inventory/warehouses')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    warehouseId = warehouses.body.find((w: { isDefault: boolean }) => w.isDefault).id;
  });

  afterEach(async () => {
    await app.close();
  });

  it('should create purchase order as DRAFT or ORDERED with valid lines (US-3.5)', async () => {
    const draft = await request(app.getHttpServer())
      .post('/api/v1/merchant/inventory/purchase-orders')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        warehouseId,
        supplierName: 'Acme Supplies',
        status: 'DRAFT',
        lines: [{ variantId, quantityOrdered: 20 }],
      })
      .expect(201);

    expect(draft.body).toMatchObject({
      supplierName: 'Acme Supplies',
      status: 'DRAFT',
      warehouseId,
    });
    expect(draft.body.lines).toHaveLength(1);
    expect(draft.body.lines[0].quantityOrdered).toBe(20);
    expect(draft.body.lines[0].quantityReceived).toBe(0);
    expect(draft.body.poNumber).toMatch(/^PO-/);

    const ordered = await request(app.getHttpServer())
      .post('/api/v1/merchant/inventory/purchase-orders')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        warehouseId,
        supplierName: 'Global Parts',
        status: 'ORDERED',
        lines: [{ variantId, quantityOrdered: 10 }],
      })
      .expect(201);

    expect(ordered.body.status).toBe('ORDERED');
    expect(ordered.body.orderedAt).toBeDefined();
  });

  it('should reject creation when variant or warehouse is invalid (US-3.5)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/merchant/inventory/purchase-orders')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        warehouseId: 'wh_nonexistent',
        supplierName: 'Acme Supplies',
        status: 'DRAFT',
        lines: [{ variantId, quantityOrdered: 5 }],
      })
      .expect(404);

    await request(app.getHttpServer())
      .post('/api/v1/merchant/inventory/purchase-orders')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        warehouseId,
        supplierName: 'Acme Supplies',
        status: 'DRAFT',
        lines: [{ variantId: 'var_nonexistent', quantityOrdered: 5 }],
      })
      .expect(400);
  });

  it('should increase on-hand stock and update received qty when receiving partial quantity (US-3.6)', async () => {
    const po = await request(app.getHttpServer())
      .post('/api/v1/merchant/inventory/purchase-orders')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        warehouseId,
        supplierName: 'Acme Supplies',
        status: 'ORDERED',
        lines: [{ variantId, quantityOrdered: 20 }],
      })
      .expect(201);

    const lineId = po.body.lines[0].id;

    await request(app.getHttpServer())
      .post(`/api/v1/merchant/inventory/purchase-orders/${po.body.id}/receive`)
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        lines: [{ purchaseOrderLineId: lineId, quantityReceived: 8 }],
      })
      .expect(200);

    const detail = await request(app.getHttpServer())
      .get(`/api/v1/merchant/inventory/purchase-orders/${po.body.id}`)
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    expect(detail.body.status).toBe('PARTIALLY_RECEIVED');
    expect(detail.body.lines[0].quantityReceived).toBe(8);
    expect(detail.body.lines[0].quantityOrdered).toBe(20);

    const levels = await request(app.getHttpServer())
      .get('/api/v1/merchant/inventory/stock-levels')
      .set('Authorization', `Bearer ${merchantToken}`)
      .query({ variantId })
      .expect(200);

    expect(levels.body.data[0].quantityOnHand).toBe(13);
  });

  it('should set status RECEIVED when all lines fully received (US-3.6)', async () => {
    const po = await request(app.getHttpServer())
      .post('/api/v1/merchant/inventory/purchase-orders')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        warehouseId,
        supplierName: 'Acme Supplies',
        status: 'ORDERED',
        lines: [{ variantId, quantityOrdered: 15 }],
      })
      .expect(201);

    const lineId = po.body.lines[0].id;

    await request(app.getHttpServer())
      .post(`/api/v1/merchant/inventory/purchase-orders/${po.body.id}/receive`)
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        lines: [{ purchaseOrderLineId: lineId, quantityReceived: 15 }],
      })
      .expect(200);

    const detail = await request(app.getHttpServer())
      .get(`/api/v1/merchant/inventory/purchase-orders/${po.body.id}`)
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    expect(detail.body.status).toBe('RECEIVED');
    expect(detail.body.lines[0].quantityReceived).toBe(15);

    const levels = await request(app.getHttpServer())
      .get('/api/v1/merchant/inventory/stock-levels')
      .set('Authorization', `Bearer ${merchantToken}`)
      .query({ variantId })
      .expect(200);

    expect(levels.body.data[0].quantityOnHand).toBe(20);
  });
});
