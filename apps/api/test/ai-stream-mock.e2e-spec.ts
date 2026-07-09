import { INestApplication } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import type { AiStreamEvent } from '@meridian/shared';
import { createTestApp } from './helpers/create-test-app';
import { MockPrisma } from './helpers/mock-prisma';

async function loginMerchant(
  app: INestApplication<App>,
  email: string,
  password: string,
) {
  const res = await request(app.getHttpServer())
    .post('/api/v1/merchant/auth/login')
    .send({ email, password });
  return res.body.accessToken as string;
}

function parseSseBody(body: string): AiStreamEvent[] {
  const events: AiStreamEvent[] = [];
  for (const chunk of body.split('\n\n')) {
    for (const line of chunk.split('\n')) {
      if (!line.startsWith('data: ')) continue;
      events.push(JSON.parse(line.slice(6)) as AiStreamEvent);
    }
  }
  return events;
}

describe('AI stream mock (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;
  let merchantToken: string;
  let variantId: string;

  beforeEach(async () => {
    ({ app, prisma } = await createTestApp());
    const password = await bcrypt.hash('secret12', 10);
    await prisma._seedMerchantOwner(
      'stream-ai-store',
      'Stream AI Store',
      'owner@stream-ai.test',
      password,
    );
    merchantToken = await loginMerchant(
      app,
      'owner@stream-ai.test',
      'secret12',
    );

    const product = await request(app.getHttpServer())
      .post('/api/v1/merchant/products')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        name: 'Stream Widget',
        isPublished: true,
        variants: [{ sku: 'STR-1', name: 'Default', price: 50, inventory: 10 }],
      })
      .expect(201);

    variantId = product.body.variants[0].id;

    await request(app.getHttpServer())
      .post('/api/v1/merchant/inventory/adjustments')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        variantId,
        quantityDelta: -6,
        reason: 'COUNT_CORRECTION',
      })
      .expect(201);
  });

  afterEach(async () => {
    await app.close();
  });

  it('streams replenishment events until done with priority items', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/merchant/inventory/ai/replenishment/stream')
      .set('Authorization', `Bearer ${merchantToken}`)
      .buffer(true)
      .parse((response, callback) => {
        const chunks: Buffer[] = [];
        response.on('data', (chunk: Buffer) => chunks.push(chunk));
        response.on('end', () => callback(null, Buffer.concat(chunks).toString()));
      })
      .expect(200);

    expect(res.headers['content-type']).toMatch(/text\/event-stream/);

    const events = parseSseBody(res.body as string);
    expect(events[0]).toMatchObject({
      type: 'started',
      feature: 'MERCHANT_REPLENISHMENT',
    });
    expect(events.some((event) => event.type === 'priority')).toBe(true);
    expect(events.some((event) => event.type === 'summary_delta')).toBe(true);

    const done = events.find((event) => event.type === 'done');
    expect(done).toBeDefined();
    if (done?.type === 'done') {
      expect(done.analysisId).toEqual(expect.any(String));
      expect((done.result as { priorities: unknown[] }).priorities.length).toBeGreaterThan(
        0,
      );
    }
  });
});
