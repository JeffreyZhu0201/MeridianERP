import { INestApplication } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './helpers/create-test-app';
import { MockPrisma } from './helpers/mock-prisma';

async function loginAs(
  app: INestApplication<App>,
  email: string,
  password: string,
) {
  const res = await request(app.getHttpServer())
    .post('/api/v1/platform/auth/login')
    .send({ email, password });
  return res.body.accessToken as string;
}

describe('Platform admins (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;
  let superAdminToken: string;
  let financeToken: string;
  let superAdminId: string;

  beforeEach(async () => {
    ({ app, prisma } = await createTestApp());
    const hash = await bcrypt.hash('admin123', 10);
    await prisma._seedPlatformAdmin('admin@meridian.test', hash, 'SUPER_ADMIN');
    await prisma._seedPlatformAdmin('finance@meridian.test', hash, 'FINANCE');

    superAdminToken = await loginAs(app, 'admin@meridian.test', 'admin123');
    financeToken = await loginAs(app, 'finance@meridian.test', 'admin123');

    const me = await request(app.getHttpServer())
      .get('/api/v1/platform/auth/me')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .expect(200);
    superAdminId = me.body.id;
  });

  afterEach(async () => {
    await app.close();
  });

  it('lists platform admins for super admin', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/platform/admins')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .expect(200);

    expect(res.body.length).toBeGreaterThanOrEqual(2);
    expect(res.body[0]).toMatchObject({
      email: expect.any(String),
      role: expect.any(String),
    });
    expect(res.body[0]).not.toHaveProperty('password');
  });

  it('creates, updates, and deletes a platform admin', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/platform/admins')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        email: 'ops@meridian.test',
        password: 'password12',
        role: 'FULFILLMENT',
      })
      .expect(201);

    expect(created.body).toMatchObject({
      email: 'ops@meridian.test',
      role: 'FULFILLMENT',
    });

    const updated = await request(app.getHttpServer())
      .patch(`/api/v1/platform/admins/${created.body.id}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ role: 'REVIEWER' })
      .expect(200);

    expect(updated.body.role).toBe('REVIEWER');

    await request(app.getHttpServer())
      .delete(`/api/v1/platform/admins/${created.body.id}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .expect(200);
  });

  it('forbids finance user from admins endpoints', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/platform/admins')
      .set('Authorization', `Bearer ${financeToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .post('/api/v1/platform/admins')
      .set('Authorization', `Bearer ${financeToken}`)
      .send({
        email: 'blocked@meridian.test',
        password: 'password12',
        role: 'REVIEWER',
      })
      .expect(403);
  });

  it('cannot delete self', async () => {
    await request(app.getHttpServer())
      .delete(`/api/v1/platform/admins/${superAdminId}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .expect(403);
  });

  it('cannot demote the last super admin', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/platform/admins/${superAdminId}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ role: 'FINANCE' })
      .expect(400);
  });
});
