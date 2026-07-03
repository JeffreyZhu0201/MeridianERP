import { INestApplication } from '@nestjs/common';
import {
  CommissionType,
  LedgerStatus,
  Prisma,
  WithdrawalRequestStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './helpers/create-test-app';
import { MockPrisma } from './helpers/mock-prisma';

async function loginPlatform(app: INestApplication<App>) {
  const res = await request(app.getHttpServer())
    .post('/api/v1/platform/auth/login')
    .send({ email: 'admin@meridian.test', password: 'admin123' });
  return res.body.accessToken as string;
}

async function loginPromoter(app: INestApplication<App>, email: string, password: string) {
  const res = await request(app.getHttpServer())
    .post('/api/v1/distributor/auth/login')
    .send({ email, password });
  return res.body.accessToken as string;
}

describe('Platform withdrawals (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;
  let platformToken: string;
  let promoterToken: string;
  let promoterId: string;
  let tenantId: string;

  beforeEach(async () => {
    ({ app, prisma } = await createTestApp());
    const hash = await bcrypt.hash('admin123', 10);
    await prisma._seedPlatformAdmin('admin@meridian.test', hash, 'SUPER_ADMIN');
    platformToken = await loginPlatform(app);

    const password = await bcrypt.hash('secret12', 10);
    const { tenant } = await prisma._seedMerchantOwner(
      'withdraw-branch',
      'Withdraw Branch',
      'owner@withdraw.test',
      password,
    );
    tenantId = tenant.id;

    const passwordHash = await bcrypt.hash('promoter1', 10);
    const promoter = await prisma.distributor.create({
      data: {
        tenantId: null,
        name: 'Withdraw Promoter',
        email: 'promoter@withdraw.test',
        commissionRate: new Prisma.Decimal(10),
        commissionType: CommissionType.PERCENT,
        isActive: true,
        portalEnabled: true,
        passwordHash,
      },
    });
    promoterId = promoter.id;
    promoterToken = await loginPromoter(app, 'promoter@withdraw.test', 'promoter1');

    await prisma.merchantProfile.update({
      where: { tenantId },
      data: { recruitedByDistributorId: promoterId },
    });

    const order = await prisma.order.create({
      data: {
        tenantId,
        distributorId: promoterId,
        status: 'FULFILLED',
        subtotal: new Prisma.Decimal(100),
        tax: new Prisma.Decimal(0),
        total: new Prisma.Decimal(100),
      },
    });

    await prisma.commissionLedger.create({
      data: {
        tenantId,
        orderId: order.id,
        distributorId: promoterId,
        amount: new Prisma.Decimal(10),
        status: LedgerStatus.SETTLED,
        customerOrderSequence: 1,
      },
    });
  });

  afterEach(async () => {
    await app.close();
  });

  it('lists withdrawals by status and distributorId', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/distributor/me/withdrawals')
      .set('Authorization', `Bearer ${promoterToken}`)
      .send({ amount: 5, note: 'test' })
      .expect(201);

    const pending = await request(app.getHttpServer())
      .get('/api/v1/platform/withdrawals?status=PENDING')
      .set('Authorization', `Bearer ${platformToken}`)
      .expect(200);

    expect(pending.body.length).toBeGreaterThanOrEqual(1);
    expect(pending.body[0]).toMatchObject({
      distributorId: promoterId,
      distributorName: 'Withdraw Promoter',
      status: WithdrawalRequestStatus.PENDING,
    });

    const filtered = await request(app.getHttpServer())
      .get(`/api/v1/platform/withdrawals?distributorId=${promoterId}`)
      .set('Authorization', `Bearer ${platformToken}`)
      .expect(200);

    expect(filtered.body.every((row: { distributorId: string }) => row.distributorId === promoterId)).toBe(
      true,
    );
  });

  it('approves and rejects pending withdrawals', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/distributor/me/withdrawals')
      .set('Authorization', `Bearer ${promoterToken}`)
      .send({ amount: 3 })
      .expect(201);

    const approved = await request(app.getHttpServer())
      .post(`/api/v1/platform/withdrawals/${created.body.id}/approve`)
      .set('Authorization', `Bearer ${platformToken}`)
      .expect(200);

    expect(approved.body.status).toBe(WithdrawalRequestStatus.APPROVED);
    expect(approved.body.reviewedAt).not.toBeNull();

    const created2 = await request(app.getHttpServer())
      .post('/api/v1/distributor/me/withdrawals')
      .set('Authorization', `Bearer ${promoterToken}`)
      .send({ amount: 2 })
      .expect(201);

    const rejected = await request(app.getHttpServer())
      .post(`/api/v1/platform/withdrawals/${created2.body.id}/reject`)
      .set('Authorization', `Bearer ${platformToken}`)
      .send({ reason: 'Invalid bank info' })
      .expect(200);

    expect(rejected.body.status).toBe(WithdrawalRequestStatus.REJECTED);
    expect(rejected.body.rejectionReason).toBe('Invalid bank info');
  });

  it('rejects withdrawal when balance insufficient', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/distributor/me/withdrawals')
      .set('Authorization', `Bearer ${promoterToken}`)
      .send({ amount: 999 })
      .expect(400);
  });
});
