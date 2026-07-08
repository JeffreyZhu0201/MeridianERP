import { INestApplication } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { MockPrisma } from './mock-prisma';

/** 1x1 PNG for multipart upload tests */
export function minimalPngBuffer(): Buffer {
  return Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  );
}

export async function loginPlatform(app: INestApplication<App>) {
  const res = await request(app.getHttpServer())
    .post('/api/v1/platform/auth/login')
    .send({ email: 'admin@meridian.test', password: 'admin123' });
  return res.body.accessToken as string;
}

export async function seedPlatformAdmin(prisma: MockPrisma) {
  const hash = await bcrypt.hash('admin123', 10);
  await prisma._seedPlatformAdmin('admin@meridian.test', hash, 'SUPER_ADMIN');
}

export async function uploadTestImage(
  app: INestApplication<App>,
  token: string,
  filename = 'test.png',
) {
  const res = await request(app.getHttpServer())
    .post('/api/v1/platform/media/upload')
    .set('Authorization', `Bearer ${token}`)
    .attach('file', minimalPngBuffer(), {
      filename,
      contentType: 'image/png',
    })
    .expect(201);
  return res.body as {
    id: string;
    url: string;
    mimeType: string;
    originalName: string;
  };
}
