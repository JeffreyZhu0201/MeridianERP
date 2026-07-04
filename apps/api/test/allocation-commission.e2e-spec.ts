import { INestApplication } from '@nestjs/common';
import {
  CommissionSource,
  CommissionType,
  LedgerStatus,
  Prisma,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { CommissionService } from '../src/commission/commission.service';
import { createTestApp } from './helpers/create-test-app';
import { MockPrisma } from './helpers/mock-prisma';
import { App } from 'supertest/types';

describe('Allocation commission (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;
  let commissionService: CommissionService;
  let tenantId: string;
  let promoterId: string;

  beforeEach(async () => {
    ({ app, prisma } = await createTestApp());
    commissionService = app.get(CommissionService);

    const password = await bcrypt.hash('secret12', 10);
    const { tenant } = await prisma._seedMerchantOwner(
      'alloc-branch',
      'Alloc Branch',
      'owner@alloc.test',
      password,
    );
    tenantId = tenant.id;

    const promoter = await prisma.distributor.create({
      data: {
        tenantId: null,
        name: 'Alloc Promoter',
        commissionRate: new Prisma.Decimal(10),
        commissionType: CommissionType.PERCENT,
        isActive: true,
      },
    });
    promoterId = promoter.id;

    await prisma.merchantProfile.update({
      where: { tenantId },
      data: { recruitedByDistributorId: promoterId, recruitedAt: new Date() },
    });
  });

  afterEach(async () => {
    await app.close();
  });

  it('accrues commission on first two CONFIRMED allocations only', async () => {
    const first = await prisma._seedConfirmedAllocation({
      tenantId,
      lines: [{ quantity: 2, wholesalePrice: 50 }],
    });
    await commissionService.accrueOnAllocationConfirmed(first.id);

    const second = await prisma._seedConfirmedAllocation({
      tenantId,
      lines: [{ quantity: 1, wholesalePrice: 100 }],
    });
    await commissionService.accrueOnAllocationConfirmed(second.id);

    const third = await prisma._seedConfirmedAllocation({
      tenantId,
      lines: [{ quantity: 1, wholesalePrice: 200 }],
    });
    await commissionService.accrueOnAllocationConfirmed(third.id);

    const ledgers = await prisma.commissionLedger.findMany({
      where: { tenantId, commissionSource: CommissionSource.ALLOCATION },
    });

    expect(ledgers).toHaveLength(2);
    expect(ledgers.map((e) => e.merchantAllocationSequence).sort()).toEqual([
      1, 2,
    ]);
    expect(ledgers.every((e) => e.distributorId === promoterId)).toBe(true);
    expect(ledgers.every((e) => e.status === LedgerStatus.ACCRUED)).toBe(true);
    expect(Number(ledgers[0].amount)).toBe(10);
    expect(Number(ledgers[1].amount)).toBe(10);
  });
});
