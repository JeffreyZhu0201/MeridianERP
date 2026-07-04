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

describe('InventoryAdjustments (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;
  let merchantToken: string;
  let warehouseId: string;
  let variantId: string;

  beforeEach(async () => {
    ({ app, prisma } = await createTestApp());
    const password = await bcrypt.hash('secret12', 10);
    await prisma._seedMerchantOwner(
      'acme-store',
      'Acme Store',
      'owner@acme.test',
      password,
    );
    merchantToken = await loginMerchant(app, 'owner@acme.test', 'secret12');

    const product = await request(app.getHttpServer())
      .post('/api/v1/merchant/products')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        name: 'Widget',
        isPublished: true,
        variants: [
          { sku: 'WIDGET-1', name: 'Default', price: 50, inventory: 10 },
        ],
      })
      .expect(201);

    variantId = product.body.variants[0].id;

    const levels = await request(app.getHttpServer())
      .get('/api/v1/merchant/inventory/stock-levels')
      .set('Authorization', `Bearer ${merchantToken}`)
      .query({ variantId })
      .expect(200);

    warehouseId = levels.body.data[0].warehouseId;
  });

  afterEach(async () => {
    await app.close();
  });

  it('should create adjustment record with audit fields when stock is adjusted (US-3.3)', async () => {
    const increase = await request(app.getHttpServer())
      .post('/api/v1/merchant/inventory/adjustments')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        warehouseId,
        variantId,
        quantityDelta: 5,
        reason: 'RETURN',
        note: 'Customer return',
      })
      .expect(201);

    expect(increase.body).toMatchObject({
      warehouseId,
      variantId,
      reason: 'RETURN',
      note: 'Customer return',
      quantityDelta: 5,
      quantityBefore: 10,
      quantityAfter: 15,
    });
    expect(increase.body.actor.email).toBe('owner@acme.test');
    expect(increase.body.createdAt).toBeDefined();

    const decrease = await request(app.getHttpServer())
      .post('/api/v1/merchant/inventory/adjustments')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        warehouseId,
        variantId,
        quantityDelta: -3,
        reason: 'DAMAGE',
      })
      .expect(201);

    expect(decrease.body).toMatchObject({
      quantityDelta: -3,
      quantityBefore: 15,
      quantityAfter: 12,
    });

    const list = await request(app.getHttpServer())
      .get('/api/v1/merchant/inventory/adjustments')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    expect(list.body.data).toHaveLength(2);
  });

  it('should default to the merchant warehouse when warehouseId is omitted (US-3.3)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/merchant/inventory/adjustments')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        variantId,
        quantityDelta: 2,
        reason: 'COUNT_CORRECTION',
      })
      .expect(201);

    expect(res.body).toMatchObject({
      warehouseId,
      variantId,
      quantityDelta: 2,
      quantityBefore: 10,
      quantityAfter: 12,
    });
  });

  it('should reject decrease adjustment when it would go below zero (US-3.3)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/merchant/inventory/adjustments')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        variantId,
        quantityDelta: -15,
        reason: 'COUNT_CORRECTION',
      })
      .expect(400);

    expect(res.body.message).toMatch(/insufficient stock/i);

    const levels = await request(app.getHttpServer())
      .get('/api/v1/merchant/inventory/stock-levels')
      .set('Authorization', `Bearer ${merchantToken}`)
      .query({ variantId })
      .expect(200);

    expect(levels.body.data[0].quantityOnHand).toBe(10);
  });

  it('should include variant on low-stock alerts when quantity is at or below threshold (US-3.4)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/merchant/inventory/adjustments')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        variantId,
        quantityDelta: -6,
        reason: 'COUNT_CORRECTION',
      })
      .expect(201);

    const alerts = await request(app.getHttpServer())
      .get('/api/v1/merchant/inventory/alerts/low-stock')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    const match = alerts.body.items.find(
      (item: { variantId: string }) => item.variantId === variantId,
    );
    expect(match).toBeDefined();
    expect(match.quantityOnHand).toBe(4);
    expect(match.reorderThreshold).toBe(5);
  });

  it('should remove variant from low-stock alerts after replenishment (US-3.4)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/merchant/inventory/adjustments')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        variantId,
        quantityDelta: -6,
        reason: 'COUNT_CORRECTION',
      })
      .expect(201);

    const lowBefore = await request(app.getHttpServer())
      .get('/api/v1/merchant/inventory/alerts/low-stock')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    expect(
      lowBefore.body.items.some(
        (item: { variantId: string }) => item.variantId === variantId,
      ),
    ).toBe(true);

    await request(app.getHttpServer())
      .post('/api/v1/merchant/inventory/adjustments')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        variantId,
        quantityDelta: 10,
        reason: 'COUNT_CORRECTION',
      })
      .expect(201);

    const lowAfter = await request(app.getHttpServer())
      .get('/api/v1/merchant/inventory/alerts/low-stock')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    expect(
      lowAfter.body.items.some(
        (item: { variantId: string }) => item.variantId === variantId,
      ),
    ).toBe(false);
  });
});
