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

  it('rejects files exceeding size limit', async () => {
    const oversized = Buffer.alloc(6 * 1024 * 1024, 0);
    oversized[0] = 0x89;
    oversized[1] = 0x50;
    oversized[2] = 0x4e;
    oversized[3] = 0x47;

    await request(app.getHttpServer())
      .post('/api/v1/platform/media/upload')
      .set('Authorization', `Bearer ${platformToken}`)
      .attach('file', oversized, {
        filename: 'huge.png',
        contentType: 'image/png',
      })
      .expect(400);
  });

  it('rejects mismatched mime and image content', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/platform/media/upload')
      .set('Authorization', `Bearer ${platformToken}`)
      .attach('file', minimalPngBuffer(), {
        filename: 'fake.jpg',
        contentType: 'image/jpeg',
      })
      .expect(400);
  });

  it('GET /media/files rejects path traversal', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/media/files/../../etc/passwd')
      .expect(404);
  });

  it('GET /media/files serves uploaded local files', async () => {
    const uploaded = await request(app.getHttpServer())
      .post('/api/v1/platform/media/upload')
      .set('Authorization', `Bearer ${platformToken}`)
      .attach('file', minimalPngBuffer(), {
        filename: 'served.png',
        contentType: 'image/png',
      })
      .expect(201);

    const url = uploaded.body.url as string;
    const key = url.split('/api/v1/media/files/')[1];

    await request(app.getHttpServer())
      .get(`/api/v1/media/files/${key}`)
      .expect(200)
      .expect('Content-Type', /image\/png/);
  });
});
