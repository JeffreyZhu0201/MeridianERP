import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './helpers/create-test-app';
import { MockPrisma } from './helpers/mock-prisma';

const sampleAddress = {
  name: 'Jane Doe',
  phone: '13800138000',
  line1: '88 Nanjing Rd',
  city: 'Shanghai',
  province: 'SH',
  postalCode: '200000',
};

describe('Store account (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;

  beforeEach(async () => {
    ({ app, prisma } = await createTestApp());
    await prisma._seedApprovedTenant('acme-store', 'Acme Store');
  });

  afterEach(async () => {
    await app.close();
  });

  async function registerGlobal() {
    const res = await request(app.getHttpServer())
      .post('/api/v1/store/auth/register')
      .send({
        email: 'account-user@example.com',
        password: 'password12',
        firstName: 'Jane',
        lastName: 'Doe',
      })
      .expect(201);
    return res.body.accessToken as string;
  }

  it('creates, lists, updates, and deletes delivery addresses', async () => {
    const token = await registerGlobal();

    const created = await request(app.getHttpServer())
      .post('/api/v1/store/auth/addresses')
      .set('Authorization', `Bearer ${token}`)
      .send(sampleAddress)
      .expect(201);

    expect(created.body.isDefault).toBe(true);
    expect(created.body.name).toBe(sampleAddress.name);

    const list = await request(app.getHttpServer())
      .get('/api/v1/store/auth/addresses')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(list.body).toHaveLength(1);

    const updated = await request(app.getHttpServer())
      .patch(`/api/v1/store/auth/addresses/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ city: 'Beijing' })
      .expect(200);

    expect(updated.body.city).toBe('Beijing');

    await request(app.getHttpServer())
      .delete(`/api/v1/store/auth/addresses/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const empty = await request(app.getHttpServer())
      .get('/api/v1/store/auth/addresses')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(empty.body).toHaveLength(0);
  });

  it('rejects cross-account address updates', async () => {
    const tokenA = await registerGlobal();
    const created = await request(app.getHttpServer())
      .post('/api/v1/store/auth/addresses')
      .set('Authorization', `Bearer ${tokenA}`)
      .send(sampleAddress)
      .expect(201);

    const tokenBRes = await request(app.getHttpServer())
      .post('/api/v1/store/auth/register')
      .send({
        email: 'other-user@example.com',
        password: 'password12',
      })
      .expect(201);
    const tokenB = tokenBRes.body.accessToken as string;

    await request(app.getHttpServer())
      .patch(`/api/v1/store/auth/addresses/${created.body.id}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ city: 'Hacked' })
      .expect(404);
  });

  it('updates profile and changes password', async () => {
    const token = await registerGlobal();

    const profile = await request(app.getHttpServer())
      .patch('/api/v1/store/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ phone: '13900001111', firstName: 'Janet' })
      .expect(200);

    expect(profile.body.phone).toBe('13900001111');
    expect(profile.body.firstName).toBe('Janet');

    await request(app.getHttpServer())
      .post('/api/v1/store/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'wrong12', newPassword: 'newpass123' })
      .expect(401);

    await request(app.getHttpServer())
      .post('/api/v1/store/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'password12', newPassword: 'newpass123' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/store/auth/login')
      .send({ email: 'account-user@example.com', password: 'newpass123' })
      .expect(201);
  });

  it('resolves addresses for slug-scoped customer JWT', async () => {
    const register = await request(app.getHttpServer())
      .post('/api/v1/store/acme-store/auth/register')
      .send({
        email: 'slug-user@example.com',
        password: 'password12',
        firstName: 'Slug',
      })
      .expect(201);

    const token = register.body.accessToken as string;

    const created = await request(app.getHttpServer())
      .post('/api/v1/store/auth/addresses')
      .set('Authorization', `Bearer ${token}`)
      .send(sampleAddress)
      .expect(201);

    expect(created.body.isDefault).toBe(true);
  });
});
