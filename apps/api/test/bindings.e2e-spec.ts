import { INestApplication } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './helpers/create-test-app';
import { MockPrisma } from './helpers/mock-prisma';

async function setupApprovedMerchantWithDistributor(
  app: INestApplication<App>,
  prisma: MockPrisma,
) {
  const hash = await bcrypt.hash('admin123', 10);
  await prisma._seedPlatformAdmin('admin@meridian.test', hash, 'SUPER_ADMIN');
  const adminLogin = await request(app.getHttpServer())
    .post('/api/v1/platform/auth/login')
    .send({ email: 'admin@meridian.test', password: 'admin123' });

  const register = await request(app.getHttpServer())
    .post('/api/v1/merchant/auth/register')
    .send({
      businessName: 'Bind Corp',
      email: 'bind@corp.test',
      password: 'secret12',
    });
  const draftToken = register.body.accessToken;
  const tenantId = register.body.tenantId;
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
    .send({ email: 'bind@corp.test', password: 'secret12' });

  const distributor = await request(app.getHttpServer())
    .post('/api/v1/merchant/distributors')
    .set('Authorization', `Bearer ${login.body.accessToken}`)
    .send({ name: 'Dist One', commissionRate: 10 })
    .expect(201);

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });

  return {
    merchantToken: login.body.accessToken,
    tenantId,
    slug: tenant!.slug,
    distributorId: distributor.body.id,
  };
}

describe('Bindings (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;
  let merchantToken: string;
  let distributorId: string;
  let tenantId: string;
  let slug: string;

  beforeEach(async () => {
    ({ app, prisma } = await createTestApp());
    ({ merchantToken, distributorId, tenantId, slug } =
      await setupApprovedMerchantWithDistributor(app, prisma));
  });

  afterEach(async () => {
    await app.close();
  });

  it('generates QR, verifies token, and claims binding', async () => {
    const qr = await request(app.getHttpServer())
      .post(`/api/v1/merchant/distributors/${distributorId}/qr`)
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({ bindType: 'MERCHANT' })
      .expect(201);

    expect(qr.body.token).toBeDefined();
    expect(qr.body.url).toContain('/bind/');
    expect(qr.body.bindType).toBe('MERCHANT');

    const verify = await request(app.getHttpServer())
      .get(`/api/v1/bindings/verify/${qr.body.token}`)
      .expect(200);
    expect(verify.body.valid).toBe(true);
    expect(verify.body.distributorId).toBe(distributorId);
    expect(verify.body.requiresAuth).toBe(false);

    const claim = await request(app.getHttpServer())
      .post('/api/v1/bindings/claim')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({ token: qr.body.token })
      .expect(201);
    expect(claim.body.distributorId).toBe(distributorId);
    expect(claim.body.bindableId).toBe(tenantId);
    expect(claim.body.bindableType).toBe('MERCHANT');

    await request(app.getHttpServer())
      .post('/api/v1/bindings/claim')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({ token: qr.body.token })
      .expect(409);
  });

  it('generates CUSTOMER QR with store bind URL', async () => {
    const qr = await request(app.getHttpServer())
      .post(`/api/v1/merchant/distributors/${distributorId}/qr`)
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({ bindType: 'CUSTOMER' })
      .expect(201);

    expect(qr.body.url).toContain(`/s/${slug}/bind/`);
    expect(qr.body.bindType).toBe('CUSTOMER');

    const verify = await request(app.getHttpServer())
      .get(`/api/v1/bindings/verify/${qr.body.token}`)
      .expect(200);
    expect(verify.body.valid).toBe(true);
    expect(verify.body.requiresAuth).toBe(true);
    expect(verify.body.tenantSlug).toBe(slug);
  });

  it('rejects merchant claim on CUSTOMER token', async () => {
    const qr = await request(app.getHttpServer())
      .post(`/api/v1/merchant/distributors/${distributorId}/qr`)
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({ bindType: 'CUSTOMER' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/bindings/claim')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({ token: qr.body.token })
      .expect(400);
  });

  it('store customer claim creates binding and sets cart distributorId', async () => {
    const qr = await request(app.getHttpServer())
      .post(`/api/v1/merchant/distributors/${distributorId}/qr`)
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({ bindType: 'CUSTOMER' })
      .expect(201);

    const register = await request(app.getHttpServer())
      .post(`/api/v1/store/${slug}/auth/register`)
      .send({
        email: 'shopper@bind.test',
        password: 'password12',
        firstName: 'Shop',
        lastName: 'Per',
      })
      .expect(201);

    const claim = await request(app.getHttpServer())
      .post(`/api/v1/store/${slug}/bindings/claim`)
      .set('Authorization', `Bearer ${register.body.accessToken}`)
      .send({ token: qr.body.token })
      .expect(201);

    expect(claim.body.binding.bindableType).toBe('CUSTOMER');
    expect(claim.body.binding.bindableId).toBe(register.body.customer.id);
    expect(claim.body.cart.distributorId).toBe(distributorId);

    const cart = await request(app.getHttpServer())
      .get(`/api/v1/store/${slug}/cart`)
      .set('Authorization', `Bearer ${register.body.accessToken}`)
      .expect(200);
    expect(cart.body.distributorId).toBe(distributorId);

    await request(app.getHttpServer())
      .post(`/api/v1/store/${slug}/bindings/claim`)
      .set('Authorization', `Bearer ${register.body.accessToken}`)
      .send({ token: qr.body.token })
      .expect(200);
  });

  it('rejects store claim when customer already bound to another distributor', async () => {
    const secondDist = await request(app.getHttpServer())
      .post('/api/v1/merchant/distributors')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({ name: 'Dist Two', commissionRate: 5 })
      .expect(201);

    const qr1 = await request(app.getHttpServer())
      .post(`/api/v1/merchant/distributors/${distributorId}/qr`)
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({ bindType: 'CUSTOMER' })
      .expect(201);

    const qr2 = await request(app.getHttpServer())
      .post(`/api/v1/merchant/distributors/${secondDist.body.id}/qr`)
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({ bindType: 'CUSTOMER' })
      .expect(201);

    const register = await request(app.getHttpServer())
      .post(`/api/v1/store/${slug}/auth/register`)
      .send({ email: 'bound@bind.test', password: 'password12' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/store/${slug}/bindings/claim`)
      .set('Authorization', `Bearer ${register.body.accessToken}`)
      .send({ token: qr1.body.token })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/store/${slug}/bindings/claim`)
      .set('Authorization', `Bearer ${register.body.accessToken}`)
      .send({ token: qr2.body.token })
      .expect(409);
  });

  it('checkout after store bind accrues commission', async () => {
    const product = await request(app.getHttpServer())
      .post('/api/v1/merchant/products')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({
        name: 'Bind Widget',
        isPublished: true,
        variants: [{ sku: 'BW-1', name: 'Default', price: 100, inventory: 5 }],
      })
      .expect(201);
    const variantId = product.body.variants[0].id;

    const qr = await request(app.getHttpServer())
      .post(`/api/v1/merchant/distributors/${distributorId}/qr`)
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({ bindType: 'CUSTOMER' })
      .expect(201);

    const register = await request(app.getHttpServer())
      .post(`/api/v1/store/${slug}/auth/register`)
      .send({ email: 'buyer@bind.test', password: 'password12' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/store/${slug}/bindings/claim`)
      .set('Authorization', `Bearer ${register.body.accessToken}`)
      .send({ token: qr.body.token })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/store/${slug}/cart/items`)
      .set('Authorization', `Bearer ${register.body.accessToken}`)
      .send({ variantId, quantity: 1 })
      .expect(201);

    const checkout = await request(app.getHttpServer())
      .post(`/api/v1/store/${slug}/checkout`)
      .set('Authorization', `Bearer ${register.body.accessToken}`)
      .send({})
      .expect(201);

    expect(checkout.body.order.status).toBe('PENDING_PAYMENT');

    await request(app.getHttpServer())
      .post(
        `/api/v1/store/${slug}/orders/${checkout.body.order.id}/simulate-payment`,
      )
      .expect(200);

    const orderDetail = await request(app.getHttpServer())
      .get(`/api/v1/merchant/orders/${checkout.body.order.id}`)
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);

    expect(orderDetail.body.distributorId).toBe(distributorId);
    expect(orderDetail.body.commissionEntry).toMatchObject({
      distributorId,
      status: 'ACCRUED',
    });
    expect(Number(orderDetail.body.commissionEntry.amount)).toBe(10);
  });

  it('returns valid false for unknown or expired bind tokens', async () => {
    const unknown = await request(app.getHttpServer())
      .get('/api/v1/bindings/verify/unknown-token-xyz')
      .expect(200);
    expect(unknown.body.valid).toBe(false);
    expect(unknown.body.error).toBeDefined();

    const qr = await request(app.getHttpServer())
      .post(`/api/v1/merchant/distributors/${distributorId}/qr`)
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({ bindType: 'CUSTOMER' })
      .expect(201);

    prisma._expireQrToken(qr.body.token);

    const expired = await request(app.getHttpServer())
      .get(`/api/v1/bindings/verify/${qr.body.token}`)
      .expect(200);
    expect(expired.body.valid).toBe(false);
    expect(expired.body.error).toBeDefined();
  });

  it('CRUD distributors', async () => {
    const list = await request(app.getHttpServer())
      .get('/api/v1/merchant/distributors')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(200);
    expect(list.body.length).toBeGreaterThan(0);

    const updated = await request(app.getHttpServer())
      .patch(`/api/v1/merchant/distributors/${distributorId}`)
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({ name: 'Dist Updated' })
      .expect(200);
    expect(updated.body.name).toBe('Dist Updated');
  });

  describe('US-4.4 QR management', () => {
    async function createStaffToken() {
      const hash = await bcrypt.hash('staff123', 10);
      await prisma.user.create({
        data: {
          tenantId,
          email: 'staff@corp.test',
          password: hash,
          role: 'MERCHANT_STAFF',
        },
      });
      const login = await request(app.getHttpServer())
        .post('/api/v1/merchant/auth/login')
        .send({ email: 'staff@corp.test', password: 'staff123' });
      return login.body.accessToken as string;
    }

    it('returns id and default 7-day expiry on generate', async () => {
      const before = Date.now();
      const qr = await request(app.getHttpServer())
        .post(`/api/v1/merchant/distributors/${distributorId}/qr`)
        .set('Authorization', `Bearer ${merchantToken}`)
        .send({ bindType: 'MERCHANT' })
        .expect(201);

      expect(qr.body.id).toBeDefined();
      const expiresMs = new Date(qr.body.expiresAt).getTime() - before;
      expect(expiresMs).toBeGreaterThan(6 * 24 * 60 * 60 * 1000);
      expect(expiresMs).toBeLessThan(8 * 24 * 60 * 60 * 1000);
    });

    it('rejects expiresInDays outside 1-90', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/merchant/distributors/${distributorId}/qr`)
        .set('Authorization', `Bearer ${merchantToken}`)
        .send({ expiresInDays: 0 })
        .expect(400);

      await request(app.getHttpServer())
        .post(`/api/v1/merchant/distributors/${distributorId}/qr`)
        .set('Authorization', `Bearer ${merchantToken}`)
        .send({ expiresInDays: 91 })
        .expect(400);
    });

    it('forbids staff from POST qr but allows history and download', async () => {
      const ownerQr = await request(app.getHttpServer())
        .post(`/api/v1/merchant/distributors/${distributorId}/qr`)
        .set('Authorization', `Bearer ${merchantToken}`)
        .send({ bindType: 'MERCHANT' })
        .expect(201);

      const staffToken = await createStaffToken();

      await request(app.getHttpServer())
        .post(`/api/v1/merchant/distributors/${distributorId}/qr`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ bindType: 'MERCHANT' })
        .expect(403);

      await request(app.getHttpServer())
        .get(`/api/v1/merchant/distributors/${distributorId}/qr`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      const download = await request(app.getHttpServer())
        .get(
          `/api/v1/merchant/distributors/${distributorId}/qr/${ownerQr.body.id}/download`,
        )
        .set('Authorization', `Bearer ${staffToken}`)
        .buffer(true)
        .parse((res, callback) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk: Buffer) => chunks.push(chunk));
          res.on('end', () => callback(null, Buffer.concat(chunks)));
        })
        .expect(200);

      expect(download.headers['content-type']).toContain('image/png');
      expect((download.body as Buffer).length).toBeGreaterThan(0);
    });

    it('regenerate revokes prior same bindType token only', async () => {
      const merchantQr1 = await request(app.getHttpServer())
        .post(`/api/v1/merchant/distributors/${distributorId}/qr`)
        .set('Authorization', `Bearer ${merchantToken}`)
        .send({ bindType: 'MERCHANT' })
        .expect(201);

      const customerQr = await request(app.getHttpServer())
        .post(`/api/v1/merchant/distributors/${distributorId}/qr`)
        .set('Authorization', `Bearer ${merchantToken}`)
        .send({ bindType: 'CUSTOMER' })
        .expect(201);

      const merchantQr2 = await request(app.getHttpServer())
        .post(`/api/v1/merchant/distributors/${distributorId}/qr`)
        .set('Authorization', `Bearer ${merchantToken}`)
        .send({ bindType: 'MERCHANT' })
        .expect(201);

      expect(merchantQr2.body.token).not.toBe(merchantQr1.body.token);
      expect(merchantQr2.body.expiresAt).toBeDefined();

      const revokedVerify = await request(app.getHttpServer())
        .get(`/api/v1/bindings/verify/${merchantQr1.body.token}`)
        .expect(200);
      expect(revokedVerify.body.valid).toBe(false);
      expect(revokedVerify.body.error).toContain('replaced');

      const activeVerify = await request(app.getHttpServer())
        .get(`/api/v1/bindings/verify/${merchantQr2.body.token}`)
        .expect(200);
      expect(activeVerify.body.valid).toBe(true);

      const customerStillValid = await request(app.getHttpServer())
        .get(`/api/v1/bindings/verify/${customerQr.body.token}`)
        .expect(200);
      expect(customerStillValid.body.valid).toBe(true);
    });

    it('lists QR history with active and revoked status', async () => {
      const first = await request(app.getHttpServer())
        .post(`/api/v1/merchant/distributors/${distributorId}/qr`)
        .set('Authorization', `Bearer ${merchantToken}`)
        .send({ bindType: 'MERCHANT', expiresInDays: 14 })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/api/v1/merchant/distributors/${distributorId}/qr`)
        .set('Authorization', `Bearer ${merchantToken}`)
        .send({ bindType: 'MERCHANT' })
        .expect(201);

      const history = await request(app.getHttpServer())
        .get(`/api/v1/merchant/distributors/${distributorId}/qr`)
        .set('Authorization', `Bearer ${merchantToken}`)
        .expect(200);

      expect(history.body.total).toBeGreaterThanOrEqual(2);
      expect(history.body.items.length).toBeGreaterThanOrEqual(2);

      const revoked = history.body.items.find(
        (entry: { id: string }) => entry.id === first.body.id,
      );
      const active = history.body.items.find(
        (entry: { status: string }) => entry.status === 'ACTIVE',
      );

      expect(revoked).toMatchObject({
        bindType: 'MERCHANT',
        status: 'REVOKED',
      });
      expect(revoked.revokedAt).toBeTruthy();
      expect(active).toBeDefined();
      expect(active.bindType).toBe('MERCHANT');
    });

    it('paginates QR history', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/merchant/distributors/${distributorId}/qr`)
        .set('Authorization', `Bearer ${merchantToken}`)
        .send({ bindType: 'MERCHANT' })
        .expect(201);

      const paged = await request(app.getHttpServer())
        .get(`/api/v1/merchant/distributors/${distributorId}/qr`)
        .set('Authorization', `Bearer ${merchantToken}`)
        .query({ page: 1, limit: 1 })
        .expect(200);

      expect(paged.body.items).toHaveLength(1);
      expect(paged.body.limit).toBe(1);
      expect(paged.body.total).toBeGreaterThanOrEqual(1);
    });

    it('downloads QR as PNG', async () => {
      const qr = await request(app.getHttpServer())
        .post(`/api/v1/merchant/distributors/${distributorId}/qr`)
        .set('Authorization', `Bearer ${merchantToken}`)
        .send({ bindType: 'CUSTOMER' })
        .expect(201);

      const download = await request(app.getHttpServer())
        .get(
          `/api/v1/merchant/distributors/${distributorId}/qr/${qr.body.id}/download`,
        )
        .set('Authorization', `Bearer ${merchantToken}`)
        .buffer(true)
        .parse((res, callback) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk: Buffer) => chunks.push(chunk));
          res.on('end', () => callback(null, Buffer.concat(chunks)));
        })
        .expect(200);

      expect(download.headers['content-type']).toContain('image/png');
      expect(Buffer.isBuffer(download.body)).toBe(true);
      expect(download.body.length).toBeGreaterThan(100);
    });

    it('rejects verify for revoked token after regenerate', async () => {
      const qr = await request(app.getHttpServer())
        .post(`/api/v1/merchant/distributors/${distributorId}/qr`)
        .set('Authorization', `Bearer ${merchantToken}`)
        .send({ bindType: 'CUSTOMER' })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/api/v1/merchant/distributors/${distributorId}/qr`)
        .set('Authorization', `Bearer ${merchantToken}`)
        .send({ bindType: 'CUSTOMER' })
        .expect(201);

      const verify = await request(app.getHttpServer())
        .get(`/api/v1/bindings/verify/${qr.body.token}`)
        .expect(200);

      expect(verify.body.valid).toBe(false);
      expect(verify.body.error).toBeDefined();
    });
  });
});
