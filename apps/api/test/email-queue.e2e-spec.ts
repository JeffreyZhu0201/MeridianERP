import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { EmailQueueService } from '../src/queue/email-queue.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { createMockPrisma } from './helpers/mock-prisma';
import { EmailJobName } from '@meridian/shared';

describe('EmailQueue (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: ReturnType<typeof createMockPrisma>;
  const enqueued: Array<{ name: string; payload: unknown }> = [];

  const mockEmailQueue: Pick<
    EmailQueueService,
    | 'sendMerchantWelcome'
    | 'sendMerchantRejected'
    | 'sendCommissionAccrued'
    | 'sendOrderConfirmation'
  > = {
    sendMerchantWelcome: async (email, businessName) => {
      enqueued.push({
        name: EmailJobName.MERCHANT_WELCOME,
        payload: { email, businessName },
      });
    },
    sendMerchantRejected: async (email, reason) => {
      enqueued.push({
        name: EmailJobName.MERCHANT_REJECTED,
        payload: { email, reason },
      });
    },
    sendCommissionAccrued: async (payload) => {
      enqueued.push({ name: EmailJobName.COMMISSION_ACCRUED, payload });
    },
    sendOrderConfirmation: async (tenantId, orderId, email) => {
      enqueued.push({
        name: EmailJobName.ORDER_CONFIRMATION,
        payload: { tenantId, orderId, email },
      });
    },
  };

  beforeEach(async () => {
    enqueued.length = 0;
    prisma = createMockPrisma();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .overrideProvider(EmailQueueService)
      .useValue(mockEmailQueue)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('enqueues order confirmation after checkout simulate-payment', async () => {
    const password = await bcrypt.hash('secret12', 10);
    const { tenant } = await prisma._seedMerchantOwner(
      'email-store',
      'Email Store',
      'owner@email.test',
      password,
    );
    const merchantLogin = await request(app.getHttpServer())
      .post('/api/v1/merchant/auth/login')
      .send({ email: 'owner@email.test', password: 'secret12' });
    const merchantToken = merchantLogin.body.accessToken as string;

    const product = await request(app.getHttpServer())
      .post('/api/v1/merchant/products')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        name: 'Mail Widget',
        isPublished: true,
        variants: [{ sku: 'MAIL-1', name: 'Default', price: 10, inventory: 5 }],
      })
      .expect(201);
    const variantId = product.body.variants[0].id;
    await prisma.merchantProfile.update({
      where: { tenantId: tenant.id },
      data: { isFlagship: false },
    });

    const sessionId = 'email-guest-session';
    await request(app.getHttpServer())
      .post('/api/v1/store/email-store/cart/items')
      .set('X-Cart-Session', sessionId)
      .send({ variantId, quantity: 1 })
      .expect(201);

    const checkout = await request(app.getHttpServer())
      .post('/api/v1/store/email-store/checkout')
      .set('X-Cart-Session', sessionId)
      .send({ guestEmail: 'guest@email.test', fulfillmentType: 'PICKUP' })
      .expect(201);

    await request(app.getHttpServer())
      .post(
        `/api/v1/store/email-store/orders/${checkout.body.order.id}/simulate-payment`,
      )
      .expect(200);

    const confirmation = enqueued.find(
      (j) => j.name === EmailJobName.ORDER_CONFIRMATION,
    );
    expect(confirmation).toBeDefined();
    expect(confirmation?.payload).toMatchObject({
      email: 'guest@email.test',
      orderId: checkout.body.order.id,
    });
  });

  it('enqueues merchant welcome on approve', async () => {
    const hash = await bcrypt.hash('admin123', 10);
    await prisma._seedPlatformAdmin('admin@meridian.test', hash, 'SUPER_ADMIN');
    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/platform/auth/login')
      .send({ email: 'admin@meridian.test', password: 'admin123' });

    const register = await request(app.getHttpServer())
      .post('/api/v1/merchant/auth/register')
      .send({
        businessName: 'Welcome Corp',
        email: 'welcome@corp.test',
        password: 'secret12',
      });
    const draftToken = register.body.accessToken;
    const profile = await request(app.getHttpServer())
      .get('/api/v1/merchant/onboarding')
      .set('Authorization', `Bearer ${draftToken}`);
    await request(app.getHttpServer())
      .post('/api/v1/merchant/onboarding/submit')
      .set('Authorization', `Bearer ${draftToken}`);

    await request(app.getHttpServer())
      .post(`/api/v1/platform/merchants/${profile.body.id}/approve`)
      .set('Authorization', `Bearer ${adminLogin.body.accessToken}`)
      .expect(201);

    const welcome = enqueued.find(
      (j) => j.name === EmailJobName.MERCHANT_WELCOME,
    );
    expect(welcome).toBeDefined();
    expect(welcome?.payload).toMatchObject({
      email: 'welcome@corp.test',
      businessName: 'Welcome Corp',
    });
  });

  it('enqueues merchant rejected on reject', async () => {
    const hash = await bcrypt.hash('admin123', 10);
    await prisma._seedPlatformAdmin('admin@meridian.test', hash, 'SUPER_ADMIN');
    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/platform/auth/login')
      .send({ email: 'admin@meridian.test', password: 'admin123' });

    const register = await request(app.getHttpServer())
      .post('/api/v1/merchant/auth/register')
      .send({
        businessName: 'Reject Corp',
        email: 'reject@corp.test',
        password: 'secret12',
      });
    const draftToken = register.body.accessToken;
    const profile = await request(app.getHttpServer())
      .get('/api/v1/merchant/onboarding')
      .set('Authorization', `Bearer ${draftToken}`);
    await request(app.getHttpServer())
      .post('/api/v1/merchant/onboarding/submit')
      .set('Authorization', `Bearer ${draftToken}`);

    await request(app.getHttpServer())
      .post(`/api/v1/platform/merchants/${profile.body.id}/reject`)
      .set('Authorization', `Bearer ${adminLogin.body.accessToken}`)
      .send({ reason: 'Incomplete docs' })
      .expect(201);

    const rejected = enqueued.find(
      (j) => j.name === EmailJobName.MERCHANT_REJECTED,
    );
    expect(rejected).toBeDefined();
    expect(rejected?.payload).toMatchObject({
      email: 'reject@corp.test',
      reason: 'Incomplete docs',
    });
  });
});
