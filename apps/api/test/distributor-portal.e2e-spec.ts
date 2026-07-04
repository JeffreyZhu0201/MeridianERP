import { INestApplication } from '@nestjs/common';
import {
  CommissionSource,
  CommissionType,
  LedgerStatus,
  Prisma,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './helpers/create-test-app';
import { MockPrisma } from './helpers/mock-prisma';

async function loginPromoter(
  app: INestApplication<App>,
  email: string,
  password: string,
) {
  const res = await request(app.getHttpServer())
    .post('/api/v1/distributor/auth/login')
    .send({ email, password });
  return res.body.accessToken as string;
}

describe('Distributor portal (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;
  let promoterToken: string;
  let promoterId: string;
  let tenantId: string;

  beforeEach(async () => {
    ({ app, prisma } = await createTestApp());

    const password = await bcrypt.hash('secret12', 10);
    const { tenant } = await prisma._seedMerchantOwner(
      'portal-branch',
      'Portal Branch',
      'owner@portal.test',
      password,
    );
    tenantId = tenant.id;

    const passwordHash = await bcrypt.hash('portalpass1', 10);
    const promoter = await prisma.distributor.create({
      data: {
        tenantId: null,
        name: 'Portal Promoter',
        email: 'promoter@portal.test',
        commissionRate: new Prisma.Decimal(10),
        commissionType: CommissionType.PERCENT,
        isActive: true,
        portalEnabled: true,
        passwordHash,
      },
    });
    promoterId = promoter.id;
    promoterToken = await loginPromoter(
      app,
      'promoter@portal.test',
      'portalpass1',
    );

    await prisma.merchantProfile.update({
      where: { tenantId },
      data: { recruitedByDistributorId: promoterId, recruitedAt: new Date() },
    });

    await prisma.commissionLedger.create({
      data: {
        tenantId,
        allocationOrderId: (
          await prisma._seedConfirmedAllocation({
            tenantId,
            lines: [{ quantity: 1, wholesalePrice: 50 }],
          })
        ).id,
        distributorId: promoterId,
        amount: new Prisma.Decimal(5),
        status: LedgerStatus.ACCRUED,
        merchantAllocationSequence: 1,
        commissionSource: CommissionSource.ALLOCATION,
      },
    });
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /distributor/auth/login returns JWT for platform promoter', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/distributor/auth/login')
      .send({
        email: 'promoter@portal.test',
        password: 'portalpass1',
      })
      .expect(200);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.distributor.id).toBe(promoterId);
    expect(res.body.distributor.isPlatformDistributor).toBe(true);
  });

  it('GET /distributor/me/* returns recruited branch and commission data', async () => {
    const dashboard = await request(app.getHttpServer())
      .get('/api/v1/distributor/me/dashboard')
      .set('Authorization', `Bearer ${promoterToken}`)
      .expect(200);

    expect(dashboard.body.distributorId).toBe(promoterId);
    expect(dashboard.body.branchCount).toBeGreaterThanOrEqual(1);
    expect(dashboard.body.commissionSummary.entryCount).toBeGreaterThanOrEqual(
      1,
    );
    expect(Array.isArray(dashboard.body.trend)).toBe(true);

    const branches = await request(app.getHttpServer())
      .get('/api/v1/distributor/me/branches')
      .set('Authorization', `Bearer ${promoterToken}`)
      .expect(200);

    expect(branches.body.length).toBeGreaterThanOrEqual(1);
    expect(branches.body[0]).toMatchObject({
      tenantId,
      businessName: 'Portal Branch',
    });
    expect(branches.body[0].lifetimeOrderCount).toBeGreaterThanOrEqual(0);

    const commissions = await request(app.getHttpServer())
      .get('/api/v1/distributor/me/commissions')
      .set('Authorization', `Bearer ${promoterToken}`)
      .expect(200);

    expect(commissions.body.items.length).toBeGreaterThanOrEqual(1);
    expect(commissions.body.items[0].merchantAllocationSequence).toBe(1);
    expect(commissions.body.items[0].businessName).toBe('Portal Branch');
  });
});
