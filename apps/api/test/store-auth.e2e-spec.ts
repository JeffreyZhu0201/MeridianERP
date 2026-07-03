import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './helpers/create-test-app';
import { MockPrisma } from './helpers/mock-prisma';

describe('StoreAuth (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;

  beforeEach(async () => {
    ({ app, prisma } = await createTestApp());
    await prisma._seedApprovedTenant('acme-store', 'Acme Store');
  });

  afterEach(async () => {
    await app.close();
  });

  it('registers a customer and returns store JWT', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/store/acme-store/auth/register')
      .send({
        email: 'shopper@example.com',
        password: 'password12',
        firstName: 'Jane',
        lastName: 'Doe',
      })
      .expect(201);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.customer).toMatchObject({
      email: 'shopper@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
    });

    const jwt = app.get(JwtService);
    const payload = jwt.verify(res.body.accessToken, {
      secret: process.env.JWT_STORE_SECRET,
    }) as { sub: string; aud: string; tenantId: string; roles: string[] };

    expect(payload.aud).toBe('store');
    expect(payload.roles).toEqual(['CUSTOMER']);
    expect(payload.sub).toBe(res.body.customer.id);
    expect(payload.tenantId).toBeDefined();
  });

  it('logs in an existing customer', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/store/acme-store/auth/register')
      .send({ email: 'shopper@example.com', password: 'password12' })
      .expect(201);

    const login = await request(app.getHttpServer())
      .post('/api/v1/store/acme-store/auth/login')
      .send({ email: 'shopper@example.com', password: 'password12' })
      .expect(201);

    expect(login.body.accessToken).toBeDefined();
    expect(login.body.customer.email).toBe('shopper@example.com');
  });

  it('rejects register on unknown store slug', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/store/unknown-store/auth/register')
      .send({ email: 'shopper@example.com', password: 'password12' })
      .expect(404);
  });

  it('rejects register on unapproved merchant', async () => {
    const tenant = await prisma.tenant.create({ data: { slug: 'draft-store' } });
    await prisma.merchantProfile.create({
      data: {
        tenantId: tenant.id,
        businessName: 'Draft Store',
        contactEmail: 'draft@merchant.test',
        onboardingStatus: 'DRAFT',
      },
    });

    await request(app.getHttpServer())
      .post('/api/v1/store/draft-store/auth/register')
      .send({ email: 'shopper@example.com', password: 'password12' })
      .expect(403);
  });

  it('rejects duplicate email within tenant', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/store/acme-store/auth/register')
      .send({ email: 'shopper@example.com', password: 'password12' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/store/acme-store/auth/register')
      .send({ email: 'shopper@example.com', password: 'otherpass1' })
      .expect(409);
  });

  it('rejects invalid login credentials', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/store/acme-store/auth/register')
      .send({ email: 'shopper@example.com', password: 'password12' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/store/acme-store/auth/login')
      .send({ email: 'shopper@example.com', password: 'wrongpassword' })
      .expect(401);
  });

  it('registers globally without store slug', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/store/auth/register')
      .send({
        email: 'global@example.com',
        password: 'password12',
        firstName: 'Global',
      })
      .expect(201);

    expect(res.body.account.email).toBe('global@example.com');
    expect(res.body.accessToken).toBeDefined();
  });

  it('logs in globally without store slug', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/store/auth/register')
      .send({ email: 'global@example.com', password: 'password12' })
      .expect(201);

    const login = await request(app.getHttpServer())
      .post('/api/v1/store/auth/login')
      .send({ email: 'global@example.com', password: 'password12' })
      .expect(201);

    expect(login.body.account.email).toBe('global@example.com');
  });
});
