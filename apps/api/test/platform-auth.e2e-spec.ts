import { INestApplication } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './helpers/create-test-app';
import { MockPrisma } from './helpers/mock-prisma';

describe('PlatformAuth (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;

  beforeEach(async () => {
    ({ app, prisma } = await createTestApp());
    const hash = await bcrypt.hash('admin123', 10);
    await prisma._seedPlatformAdmin('admin@meridian.test', hash, 'SUPER_ADMIN');
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /api/v1/platform/auth/login returns token for valid credentials', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/platform/auth/login')
      .send({ email: 'admin@meridian.test', password: 'admin123' })
      .expect(201);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.email).toBe('admin@meridian.test');
  });

  it('POST /api/v1/platform/auth/login rejects invalid credentials', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/platform/auth/login')
      .send({ email: 'admin@meridian.test', password: 'wrong12' })
      .expect(401);
  });

  it('GET /api/v1/platform/auth/me returns 401 without token', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/platform/auth/me')
      .expect(401);
  });

  it('GET /api/v1/platform/auth/me returns 401 with invalid token', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/platform/auth/me')
      .set('Authorization', 'Bearer not-a-valid-jwt')
      .expect(401);
  });
});
