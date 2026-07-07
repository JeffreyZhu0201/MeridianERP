import { INestApplication } from '@nestjs/common';
import { LeadStage } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
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

describe('Merchant CRM AI follow-up (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;
  let merchantToken: string;
  let tenantId: string;
  let leadId: string;

  beforeEach(async () => {
    ({ app, prisma } = await createTestApp());
    const password = await bcrypt.hash('secret12', 10);
    const { tenant } = await prisma._seedMerchantOwner(
      'crm-ai-branch',
      'CRM AI Branch',
      'owner@crm-ai.test',
      password,
    );
    tenantId = tenant.id;
    merchantToken = await loginMerchant(app, 'owner@crm-ai.test', 'secret12');

    await request(app.getHttpServer())
      .post('/api/v1/merchant/plugins/crm/install')
      .set('Authorization', `Bearer ${merchantToken}`)
      .expect(201);

    const lead = await prisma.crmLead.create({
      data: {
        tenantId,
        title: 'Enterprise Widget Deal',
        stage: LeadStage.NEW,
        source: 'referral',
      },
    });
    leadId = lead.id;
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns follow-up suggestions for a lead', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/merchant/crm/ai/follow-up')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({ leadId })
      .expect(201);

    expect(res.body.summary).toEqual(expect.any(String));
    expect(res.body.nextSteps.length).toBeGreaterThan(0);
    expect(res.body.sources.length).toBeGreaterThan(0);
    expect(res.body.summary).toMatch(/Enterprise Widget Deal|新建|线索/);
  });

  it('returns 404 for another tenant lead', async () => {
    const password = await bcrypt.hash('secret12', 10);
    const { tenant: otherTenant } = await prisma._seedMerchantOwner(
      'other-branch',
      'Other Branch',
      'owner@other.test',
      password,
    );
    const otherLead = await prisma.crmLead.create({
      data: {
        tenantId: otherTenant.id,
        title: 'Other Lead',
        stage: LeadStage.NEW,
      },
    });

    await request(app.getHttpServer())
      .post('/api/v1/merchant/crm/ai/follow-up')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({ leadId: otherLead.id })
      .expect(404);
  });

  it('returns 403 when CRM plugin is not installed', async () => {
    const password = await bcrypt.hash('secret12', 10);
    const { tenant } = await prisma._seedMerchantOwner(
      'no-crm-branch',
      'No CRM Branch',
      'owner@nocrm.test',
      password,
    );
    const token = await loginMerchant(app, 'owner@nocrm.test', 'secret12');
    const lead = await prisma.crmLead.create({
      data: {
        tenantId: tenant.id,
        title: 'Hidden Lead',
        stage: LeadStage.NEW,
      },
    });

    await request(app.getHttpServer())
      .post('/api/v1/merchant/crm/ai/follow-up')
      .set('Authorization', `Bearer ${token}`)
      .send({ leadId: lead.id })
      .expect(403);
  });

  it('rejects when both leadId and contactId are provided', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/merchant/crm/ai/follow-up')
      .set('Authorization', `Bearer ${merchantToken}`)
      .send({ leadId, contactId: 'ct_test' })
      .expect(400);
  });
});
