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

describe('Merchant branch price tuning (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;
  let merchantToken: string;
  let productId: string;

  beforeEach(async () => {
    ({ app, prisma } = await createTestApp());
    const password = await bcrypt.hash('secret12', 10);
    const { tenant: branchTenant } = await prisma._seedMerchantOwner(
      'branch-price',
      'Branch Price',
      'owner@branch.test',
      password,
    );

    const flagshipTenant = await prisma._seedApprovedTenant('flagship-price', 'Flagship Price');
    await prisma.merchantProfile.update({
      where: { tenantId: flagshipTenant.id },
      data: { isFlagship: true, storePublished: true },
    });

    const masterSku = await prisma.masterSku.create({
      data: {
        skuCode: 'SKU-PRICE',
        name: 'Price Test Item',
        quantityOnHand: 100,
        unitCost: new Prisma.Decimal(10),
        wholesalePrice: new Prisma.Decimal(20),
        retailPrice: new Prisma.Decimal(100),
        flagshipPrice: new Prisma.Decimal(95),
      },
    });

    const flagshipProduct = await prisma.product.create({
      data: {
        tenantId: flagshipTenant.id,
        name: 'Price Test Item',
        slug: 'sku-price',
        isPublished: true,
      },
    });
    await prisma.productVariant.create({
      data: {
        productId: flagshipProduct.id,
        masterSkuId: masterSku.id,
        sku: 'SKU-PRICE',
        name: 'Price Test Item',
        price: new Prisma.Decimal(95),
        inventory: 0,
        isActive: true,
      },
    });

    const branchProduct = await prisma.product.create({
      data: {
        tenantId: branchTenant.id,
        name: 'Price Test Item',
        slug: 'sku-price',
        isPublished: true,
      },
    });
    await prisma.productVariant.create({
      data: {
        productId: branchProduct.id,
        masterSkuId: masterSku.id,
        sku: 'SKU-PRICE',
        name: 'Price Test Item',
        price: new Prisma.Decimal(100),
        inventory: 3,
        isActive: true,
      },
    });
    productId = branchProduct.id;

    merchantToken = await loginMerchant(app, 'owner@branch.test', 'secret12');
  });

  afterEach(async () => {
    await app.close();
  });

  it('rejects branch manual product creation', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/merchant/products')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        name: 'Manual Product',
        isPublished: true,
        variants: [{ sku: 'MAN-1', name: 'Default', price: 10, inventory: 1 }],
      })
      .expect(400);
  });

  it('allows price within suggested retail deviation', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/merchant/products/${productId}`)
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        variants: [{ sku: 'SKU-PRICE', name: 'Price Test Item', price: 108 }],
      })
      .expect(200);
  });

  it('rejects price outside suggested retail deviation', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/merchant/products/${productId}`)
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        variants: [{ sku: 'SKU-PRICE', name: 'Price Test Item', price: 130 }],
      })
      .expect(400);
  });
});
