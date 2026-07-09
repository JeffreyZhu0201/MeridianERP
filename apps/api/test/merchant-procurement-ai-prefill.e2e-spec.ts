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

describe('Merchant procurement AI prefill (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;
  let merchantToken: string;
  let variantId: string;
  let masterSkuId: string;

  beforeEach(async () => {
    ({ app, prisma } = await createTestApp());
    const password = await bcrypt.hash('secret12', 10);
    await prisma._seedMerchantOwner(
      'prefill-ai-store',
      'Prefill AI Store',
      'owner@prefill-ai.test',
      password,
    );
    merchantToken = await loginMerchant(
      app,
      'owner@prefill-ai.test',
      'secret12',
    );

    const masterSku = await prisma.masterSku.create({
      data: {
        skuCode: 'PF-001',
        name: 'Prefill Widget',
        quantityOnHand: 50,
        unitCost: new Prisma.Decimal(10),
        wholesalePrice: new Prisma.Decimal(20),
        retailPrice: new Prisma.Decimal(35),
        flagshipPrice: new Prisma.Decimal(30),
        isActive: true,
      },
    });
    masterSkuId = masterSku.id;

    const product = await request(app.getHttpServer())
      .post('/api/v1/merchant/products')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        name: 'Prefill Product',
        isPublished: true,
        variants: [
          {
            sku: 'PF-V1',
            name: 'Default',
            price: 35,
            inventory: 10,
          },
        ],
      })
      .expect(201);

    variantId = product.body.variants[0].id;

    await prisma.productVariant.update({
      where: { id: variantId },
      data: { masterSkuId },
    });

    await request(app.getHttpServer())
      .post('/api/v1/merchant/inventory/adjustments')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        variantId,
        quantityDelta: -8,
        reason: 'COUNT_CORRECTION',
      })
      .expect(201);
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns 204 when no replenishment analysis exists', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/merchant/inventory/ai/replenishment/procurement-prefill')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(204);
  });

  it('maps latest analysis priorities to masterSku lines', async () => {
    const analysis = await request(app.getHttpServer())
      .post('/api/v1/merchant/inventory/ai/replenishment')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(201);

    expect(analysis.body.priorities.length).toBeGreaterThan(0);

    const prefill = await request(app.getHttpServer())
      .get('/api/v1/merchant/inventory/ai/replenishment/procurement-prefill')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    expect(prefill.body.analysisId).toBe(analysis.body.analysisId);
    expect(prefill.body.lines.length).toBeGreaterThan(0);
    expect(prefill.body.lines[0]).toMatchObject({
      masterSkuId,
      quantity: expect.any(Number),
      sku: 'PF-001',
      name: 'Prefill Widget',
    });
  });
});
