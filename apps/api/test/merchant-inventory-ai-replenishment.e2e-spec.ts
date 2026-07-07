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

describe('Merchant inventory AI replenishment (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;
  let merchantToken: string;
  let variantId: string;

  beforeEach(async () => {
    ({ app, prisma } = await createTestApp());
    const password = await bcrypt.hash('secret12', 10);
    await prisma._seedMerchantOwner(
      'replenish-ai-store',
      'Replenish AI Store',
      'owner@replenish-ai.test',
      password,
    );
    merchantToken = await loginMerchant(
      app,
      'owner@replenish-ai.test',
      'secret12',
    );

    const product = await request(app.getHttpServer())
      .post('/api/v1/merchant/products')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        name: 'Low Stock Widget',
        isPublished: true,
        variants: [
          { sku: 'LSW-1', name: 'Default', price: 50, inventory: 10 },
        ],
      })
      .expect(201);

    variantId = product.body.variants[0].id;

    await request(app.getHttpServer())
      .post('/api/v1/merchant/inventory/adjustments')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        variantId,
        quantityDelta: -6,
        reason: 'COUNT_CORRECTION',
      })
      .expect(201);
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns replenishment priorities for low-stock SKUs', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/merchant/inventory/ai/replenishment')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(201);

    expect(res.body.summary).toEqual(expect.any(String));
    expect(res.body.priorities.length).toBeGreaterThan(0);
    expect(res.body.sources.length).toBeGreaterThan(0);
    expect(
      res.body.priorities.some(
        (item: { variantId: string }) => item.variantId === variantId,
      ),
    ).toBe(true);
    expect(res.body.summary).toMatch(/低库存|缺货|SKU/);
  });

  it('returns empty priorities when no low-stock alerts', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/merchant/inventory/adjustments')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        variantId,
        quantityDelta: 20,
        reason: 'COUNT_CORRECTION',
      })
      .expect(201);

    const res = await request(app.getHttpServer())
      .post('/api/v1/merchant/inventory/ai/replenishment')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(201);

    expect(res.body.priorities).toEqual([]);
    expect(res.body.summary).toMatch(/没有|暂无|无/);
  });
});
