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
        variants: [{ sku: 'LSW-1', name: 'Default', price: 50, inventory: 10 }],
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
    expect(res.body.analysisId).toEqual(expect.any(String));
    expect(res.body.createdAt).toEqual(expect.any(String));
    expect(res.body.priorities.length).toBeGreaterThan(0);
    expect(res.body.sources.length).toBeGreaterThan(0);
    expect(
      res.body.priorities.some(
        (item: { variantId: string }) => item.variantId === variantId,
      ),
    ).toBe(true);
    expect(res.body.summary).toMatch(/低库存|缺货|SKU/);

    const latest = await request(app.getHttpServer())
      .get('/api/v1/merchant/inventory/ai/replenishment/latest')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    expect(latest.body.analysisId).toBe(res.body.analysisId);

    const history = await request(app.getHttpServer())
      .get('/api/v1/merchant/inventory/ai/replenishment/history')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    expect(history.body.total).toBeGreaterThanOrEqual(1);
    expect(history.body.items[0].id).toBe(res.body.analysisId);
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
    expect(res.body.analysisId).toEqual(expect.any(String));
  });

  it('returns null latest before any analysis exists for a new tenant', async () => {
    const password = await bcrypt.hash('other12', 10);
    await prisma._seedMerchantOwner(
      'other-ai-store',
      'Other AI Store',
      'owner@other-ai.test',
      password,
    );
    const otherToken = await loginMerchant(
      app,
      'owner@other-ai.test',
      'other12',
    );

    const latest = await request(app.getHttpServer())
      .get('/api/v1/merchant/inventory/ai/replenishment/latest')
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(204);

    expect(latest.body).toEqual({});
  });

  it('returns procurement prefill lines after analysis with linked master SKU', async () => {
    const masterSku = await prisma.masterSku.create({
      data: {
        skuCode: 'REP-MSKU',
        name: 'Replenish HQ SKU',
        quantityOnHand: 40,
        unitCost: new Prisma.Decimal(8),
        wholesalePrice: new Prisma.Decimal(15),
        retailPrice: new Prisma.Decimal(28),
        flagshipPrice: new Prisma.Decimal(25),
        isActive: true,
      },
    });

    await prisma.productVariant.update({
      where: { id: variantId },
      data: { masterSkuId: masterSku.id },
    });

    await request(app.getHttpServer())
      .post('/api/v1/merchant/inventory/ai/replenishment')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(201);

    const prefill = await request(app.getHttpServer())
      .get('/api/v1/merchant/inventory/ai/replenishment/procurement-prefill')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    expect(
      prefill.body.lines.some(
        (line: { masterSkuId: string }) => line.masterSkuId === masterSku.id,
      ),
    ).toBe(true);
  });
});
