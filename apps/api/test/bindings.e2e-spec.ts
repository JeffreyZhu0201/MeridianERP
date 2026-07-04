import { INestApplication } from '@nestjs/common';
import { BindType, CommissionType, Prisma } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { EnvService } from '../src/config/env.service';
import { createTestApp } from './helpers/create-test-app';
import { MockPrisma } from './helpers/mock-prisma';

async function seedMerchantBindToken(
  app: INestApplication<App>,
  prisma: MockPrisma,
  tenantId: string,
  distributorId: string,
) {
  const jwt = app.get(JwtService);
  const env = app.get(EnvService);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const token = jwt.sign(
    {
      distributorId,
      tenantId,
      bindType: BindType.MERCHANT,
      purpose: 'bind',
      jti: randomUUID(),
    },
    {
      secret: env.getOrThrow('BIND_TOKEN_SECRET'),
      expiresIn: '7d',
    },
  );
  await prisma.distributorQrCode.create({
    data: {
      distributorId,
      token,
      bindType: BindType.MERCHANT,
      expiresAt,
    },
  });
  return token;
}

describe('Bindings (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;
  let merchantToken: string;
  let distributorId: string;
  let tenantId: string;

  beforeEach(async () => {
    ({ app, prisma } = await createTestApp());
    const password = await bcrypt.hash('secret12', 10);
    const { tenant } = await prisma._seedMerchantOwner(
      'bind-corp',
      'Bind Corp',
      'bind@corp.test',
      password,
    );
    tenantId = tenant.id;

    const login = await request(app.getHttpServer())
      .post('/api/v1/merchant/auth/login')
      .send({ email: 'bind@corp.test', password: 'secret12' });
    merchantToken = login.body.accessToken;

    const distributor = await prisma.distributor.create({
      data: {
        tenantId,
        name: 'Dist One',
        commissionRate: new Prisma.Decimal(10),
        commissionType: CommissionType.PERCENT,
      },
    });
    distributorId = distributor.id;
  });

  afterEach(async () => {
    await app.close();
  });

  it('verifies token and claims MERCHANT binding', async () => {
    const token = await seedMerchantBindToken(
      app,
      prisma,
      tenantId,
      distributorId,
    );

    const verify = await request(app.getHttpServer())
      .get(`/api/v1/bindings/verify/${token}`)
      .expect(200);
    expect(verify.body.valid).toBe(true);
    expect(verify.body.distributorId).toBe(distributorId);
    expect(verify.body.requiresAuth).toBe(false);

    const claim = await request(app.getHttpServer())
      .post('/api/v1/bindings/claim')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({ token })
      .expect(201);
    expect(claim.body.distributorId).toBe(distributorId);
    expect(claim.body.bindableId).toBe(tenantId);
    expect(claim.body.bindableType).toBe('MERCHANT');

    await request(app.getHttpServer())
      .post('/api/v1/bindings/claim')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({ token })
      .expect(409);
  });

  it('returns 404 for removed store customer bind endpoint', async () => {
    const register = await request(app.getHttpServer())
      .post('/api/v1/store/bind-corp/auth/register')
      .send({ email: 'shopper@bind.test', password: 'password12' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/store/bind-corp/bindings/claim')
      .set('Authorization', `Bearer ${register.body.accessToken}`)
      .send({ token: 'any-token' })
      .expect(404);
  });

  it('merchant distributor APIs return 403 (Phase 5)', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/merchant/distributors/${distributorId}/qr`)
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({ bindType: 'CUSTOMER' })
      .expect(403);

    await request(app.getHttpServer())
      .get('/api/v1/merchant/distributors')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(403);
  });

  it('returns valid false for unknown or expired bind tokens', async () => {
    const unknown = await request(app.getHttpServer())
      .get('/api/v1/bindings/verify/unknown-token-xyz')
      .expect(200);
    expect(unknown.body.valid).toBe(false);
    expect(unknown.body.error).toBeDefined();

    const token = await seedMerchantBindToken(
      app,
      prisma,
      tenantId,
      distributorId,
    );
    prisma._expireQrToken(token);

    const expired = await request(app.getHttpServer())
      .get(`/api/v1/bindings/verify/${token}`)
      .expect(200);
    expect(expired.body.valid).toBe(false);
    expect(expired.body.error).toBeDefined();
  });
});
