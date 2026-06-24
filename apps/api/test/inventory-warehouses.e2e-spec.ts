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

describe('InventoryWarehouses (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;
  let merchantToken: string;
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
        variants: [{ sku: 'WIDGET-1', name: 'Default', price: 50, inventory: 25 }],
      })
      .expect(201);

    variantId = product.body.variants[0].id;
  });

  afterEach(async () => {
    await app.close();
  });

  it('should create warehouse with name and address when merchant owner (US-3.1)', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/merchant/inventory/warehouses')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({ name: 'East Coast DC', address: '100 Harbor Rd, Boston MA' })
      .expect(201);

    expect(created.body).toMatchObject({
      name: 'East Coast DC',
      address: '100 Harbor Rd, Boston MA',
      isActive: true,
    });

    const list = await request(app.getHttpServer())
      .get('/api/v1/merchant/inventory/warehouses')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    const names = list.body.map((w: { name: string }) => w.name);
    expect(names).toContain('East Coast DC');
    expect(names).toContain('Default Warehouse');
  });

  it('should ensure exactly one default warehouse per tenant when setting default (US-3.1)', async () => {
    const east = await request(app.getHttpServer())
      .post('/api/v1/merchant/inventory/warehouses')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({ name: 'East Coast DC' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/merchant/inventory/warehouses/${east.body.id}/set-default`)
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    const list = await request(app.getHttpServer())
      .get('/api/v1/merchant/inventory/warehouses')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    const defaults = list.body.filter((w: { isDefault: boolean }) => w.isDefault);
    expect(defaults).toHaveLength(1);
    expect(defaults[0].name).toBe('East Coast DC');
  });

  it('should show quantity on hand per warehouse when viewing stock levels (US-3.2)', async () => {
    const east = await request(app.getHttpServer())
      .post('/api/v1/merchant/inventory/warehouses')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({ name: 'East Coast DC' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/merchant/inventory/adjustments')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        warehouseId: east.body.id,
        variantId,
        quantityDelta: 8,
        reason: 'COUNT_CORRECTION',
      })
      .expect(201);

    const levels = await request(app.getHttpServer())
      .get('/api/v1/merchant/inventory/stock-levels')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    const byWarehouse = levels.body.data.reduce(
      (acc: Record<string, number>, row: { warehouseId: string; quantityOnHand: number }) => {
        acc[row.warehouseId] = row.quantityOnHand;
        return acc;
      },
      {},
    );

    expect(byWarehouse[east.body.id]).toBe(8);
    const defaultWarehouse = levels.body.data.find(
      (row: { warehouse: { name: string } }) => row.warehouse.name === 'Default Warehouse',
    );
    expect(defaultWarehouse.quantityOnHand).toBe(25);
  });

  it('should migrate legacy variant inventory to default warehouse without data loss (US-3.2)', async () => {
    const levels = await request(app.getHttpServer())
      .get('/api/v1/merchant/inventory/stock-levels')
      .set('Authorization', `Bearer ${merchantToken}`)
      .query({ variantId })
      .expect(200);

    expect(levels.body.data).toHaveLength(1);
    expect(levels.body.data[0]).toMatchObject({
      variantId,
      quantityOnHand: 25,
    });
    expect(levels.body.data[0].warehouse.isDefault).toBe(true);
    expect(levels.body.data[0].variant.sellableInventory).toBe(25);

    const products = await request(app.getHttpServer())
      .get('/api/v1/merchant/products')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    expect(products.body[0].variants[0].inventory).toBe(25);
  });
});
