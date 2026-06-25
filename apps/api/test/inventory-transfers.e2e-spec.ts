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

describe('InventoryTransfers (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;
  let merchantToken: string;
  let fromWarehouseId: string;
  let toWarehouseId: string;
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
        variants: [{ sku: 'WIDGET-1', name: 'Default', price: 50, inventory: 20 }],
      })
      .expect(201);

    variantId = product.body.variants[0].id;

    const warehouses = await request(app.getHttpServer())
      .get('/api/v1/merchant/inventory/warehouses')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    fromWarehouseId = warehouses.body.find((w: { isDefault: boolean }) => w.isDefault).id;

    const secondWarehouse = await request(app.getHttpServer())
      .post('/api/v1/merchant/inventory/warehouses')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({ name: 'East Warehouse', address: 'Building B' })
      .expect(201);

    toWarehouseId = secondWarehouse.body.id;
  });

  afterEach(async () => {
    await app.close();
  });

  it('should create transfer, move stock between warehouses, and list transfers (US-3.15)', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/merchant/inventory/transfers')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        fromWarehouseId,
        toWarehouseId,
        note: 'Replenish east',
        lines: [{ variantId, quantity: 8 }],
      })
      .expect(201);

    expect(created.body).toMatchObject({
      fromWarehouseId,
      toWarehouseId,
      status: 'COMPLETED',
      note: 'Replenish east',
    });
    expect(created.body.lines).toHaveLength(1);
    expect(created.body.lines[0]).toMatchObject({ variantId, quantity: 8 });
    expect(created.body.createdBy.email).toBe('owner@acme.test');

    const fromLevels = await request(app.getHttpServer())
      .get('/api/v1/merchant/inventory/stock-levels')
      .set('Authorization', `Bearer ${merchantToken}`)
      .query({ warehouseId: fromWarehouseId, variantId })
      .expect(200);

    const toLevels = await request(app.getHttpServer())
      .get('/api/v1/merchant/inventory/stock-levels')
      .set('Authorization', `Bearer ${merchantToken}`)
      .query({ warehouseId: toWarehouseId, variantId })
      .expect(200);

    expect(fromLevels.body.data[0].quantityOnHand).toBe(12);
    expect(toLevels.body.data[0].quantityOnHand).toBe(8);

    const list = await request(app.getHttpServer())
      .get('/api/v1/merchant/inventory/transfers')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0].id).toBe(created.body.id);

    const detail = await request(app.getHttpServer())
      .get(`/api/v1/merchant/inventory/transfers/${created.body.id}`)
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    expect(detail.body.id).toBe(created.body.id);
    expect(detail.body.lines[0].variant.sku).toBe('WIDGET-1');
  });

  it('should reject transfer when source stock is insufficient (US-3.15)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/merchant/inventory/transfers')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        fromWarehouseId,
        toWarehouseId,
        lines: [{ variantId, quantity: 25 }],
      })
      .expect(400);

    expect(res.body.message).toMatch(/insufficient stock/i);
  });

  it('should reject transfer when source and destination are the same (US-3.15)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/merchant/inventory/transfers')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        fromWarehouseId,
        toWarehouseId: fromWarehouseId,
        lines: [{ variantId, quantity: 1 }],
      })
      .expect(400);

    expect(res.body.message).toMatch(/must differ/i);
  });
});
