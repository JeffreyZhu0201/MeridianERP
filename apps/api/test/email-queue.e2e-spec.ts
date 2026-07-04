import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { BindType, CommissionType, Prisma } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { EmailQueueService } from '../src/queue/email-queue.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { EnvService } from '../src/config/env.service';
import { createMockPrisma } from './helpers/mock-prisma';
import { EmailJobName } from '@meridian/shared';

async function seedMerchantBindToken(
  app: INestApplication<App>,
  prisma: ReturnType<typeof createMockPrisma>,
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

describe('EmailQueue (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: ReturnType<typeof createMockPrisma>;
  const enqueued: Array<{ name: string; payload: unknown }> = [];

  const mockEmailQueue: Pick<
    EmailQueueService,
    | 'sendMerchantWelcome'
    | 'sendMerchantRejected'
    | 'sendBindingCreated'
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
    sendBindingCreated: async (payload) => {
      enqueued.push({
        name: EmailJobName.DISTRIBUTOR_BINDING_CREATED,
        payload,
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
    await prisma._seedMerchantOwner(
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

  it('enqueues binding created email when merchant claims QR binding', async () => {
    const hash = await bcrypt.hash('admin123', 10);
    await prisma._seedPlatformAdmin('admin@meridian.test', hash, 'SUPER_ADMIN');
    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/platform/auth/login')
      .send({ email: 'admin@meridian.test', password: 'admin123' });

    const register = await request(app.getHttpServer())
      .post('/api/v1/merchant/auth/register')
      .send({
        businessName: 'Bind Email Corp',
        email: 'bind-email@corp.test',
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
      .set('Authorization', `Bearer ${adminLogin.body.accessToken}`);

    const login = await request(app.getHttpServer())
      .post('/api/v1/merchant/auth/login')
      .send({ email: 'bind-email@corp.test', password: 'secret12' });
    const merchantToken = login.body.accessToken as string;

    const merchantProfile = await prisma.merchantProfile.findFirst({
      where: { contactEmail: 'bind-email@corp.test' },
    });
    const distributor = await prisma.distributor.create({
      data: {
        tenantId: merchantProfile!.tenantId,
        name: 'Email Dist',
        commissionRate: new Prisma.Decimal(5),
        commissionType: CommissionType.PERCENT,
      },
    });
    const token = await seedMerchantBindToken(
      app,
      prisma,
      merchantProfile!.tenantId,
      distributor.id,
    );

    await request(app.getHttpServer())
      .post('/api/v1/bindings/claim')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({ token })
      .expect(201);

    const bindingJob = enqueued.find(
      (j) => j.name === EmailJobName.DISTRIBUTOR_BINDING_CREATED,
    );
    expect(bindingJob).toBeDefined();
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
