import { INestApplication } from '@nestjs/common';
import { CommissionType, LedgerStatus, Prisma } from '@prisma/client';
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

describe('Distributor share invite codes (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;
  let promoterToken: string;
  let promoterId: string;

  beforeEach(async () => {
    ({ app, prisma } = await createTestApp());
    const hash = await bcrypt.hash('admin123', 10);
    await prisma._seedPlatformAdmin('admin@meridian.test', hash, 'SUPER_ADMIN');

    const passwordHash = await bcrypt.hash('promoter1', 10);
    const promoter = await prisma.distributor.create({
      data: {
        tenantId: null,
        name: 'Field Promoter',
        email: 'promoter@share.test',
        commissionRate: new Prisma.Decimal(10),
        commissionType: CommissionType.PERCENT,
        isActive: true,
        portalEnabled: true,
        passwordHash,
      },
    });
    promoterId = promoter.id;
    promoterToken = await loginPromoter(app, 'promoter@share.test', 'promoter1');
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /distributor/me/invite-codes creates open-shop URL', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/distributor/me/invite-codes')
      .set('Authorization', `Bearer ${promoterToken}`)
      .send({})
      .expect(201);

    expect(res.body.code).toMatch(/^[A-Z]{6}$/);
    expect(res.body.url).toContain('/open-shop?invite=');
    expect(res.body.distributorId).toBe(promoterId);
    expect(res.body.revokedAt).toBeNull();
  });

  it('GET /distributor/me/invite-codes lists promoter codes', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/distributor/me/invite-codes')
      .set('Authorization', `Bearer ${promoterToken}`)
      .send({})
      .expect(201);

    const list = await request(app.getHttpServer())
      .get('/api/v1/distributor/me/invite-codes')
      .set('Authorization', `Bearer ${promoterToken}`)
      .expect(200);

    expect(Array.isArray(list.body)).toBe(true);
    expect(list.body.length).toBeGreaterThanOrEqual(1);
    expect(list.body[0].url).toContain('/open-shop?invite=');
  });

  it('POST revoke marks invite code revoked', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/distributor/me/invite-codes')
      .set('Authorization', `Bearer ${promoterToken}`)
      .send({})
      .expect(201);

    const revoked = await request(app.getHttpServer())
      .post(`/api/v1/distributor/me/invite-codes/${created.body.id}/revoke`)
      .set('Authorization', `Bearer ${promoterToken}`)
      .expect(200);

    expect(revoked.body.revokedAt).not.toBeNull();
  });
});
