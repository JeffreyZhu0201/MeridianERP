import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './helpers/create-test-app';
import {
  loginPlatform,
  minimalPngBuffer,
  seedPlatformAdmin,
} from './helpers/test-media';

describe('Platform media upload (e2e)', () => {
  let app: INestApplication<App>;
  let platformToken: string;

  beforeEach(async () => {
    const setup = await createTestApp();
    app = setup.app;
    await seedPlatformAdmin(setup.prisma);
    platformToken = await loginPlatform(app);
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /platform/media/upload accepts a valid PNG', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/platform/media/upload')
      .set('Authorization', `Bearer ${platformToken}`)
      .attach('file', minimalPngBuffer(), {
        filename: 'product.png',
        contentType: 'image/png',
      })
      .expect(201);

    expect(res.body).toMatchObject({
      id: expect.any(String),
      url: expect.stringContaining('/api/v1/media/files/'),
      mimeType: 'image/png',
      originalName: 'product.png',
    });
  });

  it('rejects uploads without platform auth', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/platform/media/upload')
      .attach('file', minimalPngBuffer(), {
        filename: 'product.png',
        contentType: 'image/png',
      })
      .expect(401);
  });

  it('rejects unsupported mime types', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/platform/media/upload')
      .set('Authorization', `Bearer ${platformToken}`)
      .attach('file', Buffer.from('not an image'), {
        filename: 'notes.txt',
        contentType: 'text/plain',
      })
      .expect(400);
  });
});
