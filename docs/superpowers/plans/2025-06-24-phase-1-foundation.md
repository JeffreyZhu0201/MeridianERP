# Phase 1 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the MeridianERP monorepo and deliver Phase 1: platform/merchant auth, merchant onboarding, CRM, distributor QR binding.

**Architecture:** Monolith NestJS API + two Next.js portals (admin, merchant), PostgreSQL + Redis + BullMQ, shared types in `packages/shared`, UI shells in `packages/ui`.

**Tech Stack:** TypeScript, pnpm, Turborepo, Next.js App Router, shadcn/ui, NestJS, Prisma, PostgreSQL, Redis, BullMQ, Docker Compose.

**Reference docs:** `docs/prd/phase-1-foundation.md`, `docs/architecture/phase-1-foundation.md`, `docs/design/design-system.md`

---

### Task 1: Monorepo Root Scaffold

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `.gitignore`, `.env.example`
- Create: `packages/shared/package.json`, `packages/shared/tsconfig.json`, `packages/shared/src/index.ts`

- [ ] **Step 1: Create root package.json**

```json
{
  "name": "meridian-erp",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "test": "turbo test",
    "lint": "turbo lint",
    "test:e2e": "playwright test"
  },
  "devDependencies": {
    "turbo": "^2.3.0",
    "typescript": "^5.7.0"
  },
  "packageManager": "pnpm@9.15.0"
}
```

- [ ] **Step 2: Create pnpm-workspace.yaml**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 3: Create turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": [".next/**", "dist/**"] },
    "dev": { "cache": false, "persistent": true },
    "test": { "dependsOn": ["^build"] },
    "lint": {}
  }
}
```

- [ ] **Step 4: Create packages/shared with enums**

Create `packages/shared/src/enums.ts`:

```typescript
export enum OnboardingStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum LeadStage {
  NEW = 'NEW',
  QUALIFIED = 'QUALIFIED',
  WON = 'WON',
  LOST = 'LOST',
}

export enum ActivityType {
  CALL = 'CALL',
  NOTE = 'NOTE',
  MEETING = 'MEETING',
}

export enum CommissionType {
  PERCENT = 'PERCENT',
  FIXED = 'FIXED',
}

export enum BindType {
  MERCHANT = 'MERCHANT',
  CUSTOMER = 'CUSTOMER',
}

export enum PlatformRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  PLATFORM_OPS = 'PLATFORM_OPS',
}

export enum MerchantRole {
  MERCHANT_OWNER = 'MERCHANT_OWNER',
  MERCHANT_STAFF = 'MERCHANT_STAFF',
}
```

- [ ] **Step 5: Verify workspace**

Run: `pnpm install`  
Expected: installs without error

---

### Task 2: NestJS API Scaffold

**Files:**
- Create: `apps/api/` via `nest new api --package-manager pnpm`
- Create: `apps/api/prisma/schema.prisma` (from `docs/architecture/phase-1-foundation.md`)
- Create: `apps/api/src/prisma/prisma.service.ts`, `apps/api/src/prisma/prisma.module.ts`

- [ ] **Step 1: Scaffold NestJS app**

Run: `cd apps && pnpm dlx @nestjs/cli new api --package-manager pnpm --skip-git`

- [ ] **Step 2: Add Prisma schema**

Copy full schema from `docs/architecture/phase-1-foundation.md` into `apps/api/prisma/schema.prisma`.

- [ ] **Step 3: Install dependencies**

Run:
```bash
cd apps/api
pnpm add @prisma/client @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt class-validator class-transformer @nestjs/bullmq bullmq ioredis @nestjs/config
pnpm add -D prisma @types/bcrypt @types/passport-jwt
```

- [ ] **Step 4: Generate Prisma client**

Run: `pnpm prisma generate`  
Expected: client generated in `node_modules/.prisma/client`

- [ ] **Step 5: Create initial migration**

Run: `pnpm prisma migrate dev --name init`  
Expected: migration applied to local postgres

---

### Task 3: Platform Auth (TDD)

**Files:**
- Create: `apps/api/src/auth/platform-jwt.strategy.ts`
- Create: `apps/api/src/platform/auth/platform-auth.controller.ts`
- Create: `apps/api/src/platform/auth/platform-auth.service.ts`
- Test: `apps/api/test/platform-auth.e2e-spec.ts`

- [ ] **Step 1: Write failing e2e test**

```typescript
// apps/api/test/platform-auth.e2e-spec.ts
describe('Platform Auth (e2e)', () => {
  it('POST /api/v1/platform/auth/login returns token for valid credentials', () => {
    return request(app.getHttpServer())
      .post('/api/v1/platform/auth/login')
      .send({ email: 'admin@meridian.test', password: 'admin123' })
      .expect(201)
      .expect((res) => {
        expect(res.body.accessToken).toBeDefined();
      });
  });

  it('POST /api/v1/platform/auth/login returns 401 for invalid credentials', () => {
    return request(app.getHttpServer())
      .post('/api/v1/platform/auth/login')
      .send({ email: 'admin@meridian.test', password: 'wrong' })
      .expect(401);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @meridian/api test:e2e -- --testPathPattern=platform-auth`  
Expected: FAIL — route not found

- [ ] **Step 3: Implement PlatformAuthService**

```typescript
@Injectable()
export class PlatformAuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async login(email: string, password: string) {
    const user = await this.prisma.platformUser.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = { sub: user.id, aud: 'admin', roles: [user.role] };
    return { accessToken: this.jwt.sign(payload) };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @meridian/api test:e2e -- --testPathPattern=platform-auth`  
Expected: PASS

- [ ] **Step 5: Seed platform admin**

Add to `apps/api/prisma/seed.ts`:

```typescript
await prisma.platformUser.upsert({
  where: { email: 'admin@meridian.test' },
  update: {},
  create: {
    email: 'admin@meridian.test',
    password: await bcrypt.hash('admin123', 10),
    role: 'SUPER_ADMIN',
  },
});
```

Run: `pnpm prisma db seed`

---

### Task 4: Merchant Auth and Onboarding (TDD)

**Files:**
- Create: `apps/api/src/merchant/auth/merchant-auth.controller.ts`
- Create: `apps/api/src/merchant/onboarding/onboarding.controller.ts`
- Create: `apps/api/src/merchant/onboarding/onboarding.service.ts`
- Create: `apps/api/src/platform/merchants/merchants.controller.ts`
- Test: `apps/api/test/merchant-onboarding.e2e-spec.ts`

- [ ] **Step 1: Write failing e2e test for register → submit → approve flow**

```typescript
describe('Merchant Onboarding (e2e)', () => {
  it('registers merchant in DRAFT status', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/merchant/auth/register')
      .send({
        email: 'owner@test.com',
        password: 'pass1234',
        businessName: 'Test Store',
        contactEmail: 'owner@test.com',
      })
      .expect(201);
    expect(res.body.onboardingStatus).toBe('DRAFT');
  });

  it('admin approves merchant and enables login', async () => {
    // submit onboarding, admin approve, then login succeeds
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

- [ ] **Step 3: Implement OnboardingService with state machine**

States: DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED | REJECTED  
On APPROVED: create Tenant slug, activate User.

- [ ] **Step 4: Implement MerchantsController for admin approve/reject**

```typescript
@Post(':id/approve')
@UseGuards(PlatformAuthGuard)
async approve(@Param('id') id: string) {
  return this.merchantsService.approve(id);
}

@Post(':id/reject')
@UseGuards(PlatformAuthGuard)
async reject(@Param('id') id: string, @Body() dto: RejectMerchantDto) {
  return this.merchantsService.reject(id, dto.reason);
}
```

- [ ] **Step 5: Run tests — expect PASS**

---

### Task 5: CRM Module (TDD)

**Files:**
- Create: `apps/api/src/merchant/crm/companies/`, `contacts/`, `leads/`, `activities/`
- Test: `apps/api/test/crm.e2e-spec.ts`

- [ ] **Step 1: Write failing test for tenant-scoped contact CRUD**

```typescript
it('creates contact scoped to tenant', async () => {
  const token = await getMerchantToken();
  const res = await request(app.getHttpServer())
    .post('/api/v1/merchant/contacts')
    .set('Authorization', `Bearer ${token}`)
    .send({ firstName: 'Jane', lastName: 'Doe', email: 'jane@test.com' })
    .expect(201);
  expect(res.body.tenantId).toBeDefined();
});

it('cannot access another tenant contact', async () => {
  // create with tenant A token, fetch with tenant B token → 404
});
```

- [ ] **Step 2: Run test — expect FAIL**

- [ ] **Step 3: Implement CRM modules with TenantInterceptor**

- [ ] **Step 4: Implement lead stage transition endpoint**

`PATCH /api/v1/merchant/leads/:id/stage` with `{ stage: 'QUALIFIED' }`

- [ ] **Step 5: Run tests — expect PASS**

---

### Task 6: Distributor and QR Binding (TDD)

**Files:**
- Create: `apps/api/src/merchant/distributors/distributors.service.ts`
- Create: `apps/api/src/bindings/bindings.controller.ts`
- Test: `apps/api/test/bindings.e2e-spec.ts`

- [ ] **Step 1: Write failing test for QR claim flow**

```typescript
it('claims bind token and creates binding + lead', async () => {
  const { token } = await createDistributorQr(merchantToken);
  const res = await request(app.getHttpServer())
    .post('/api/v1/bindings/claim')
    .set('Authorization', `Bearer ${merchantToken}`)
    .send({ token })
    .expect(201);
  expect(res.body.distributorId).toBeDefined();

  const leads = await request(app.getHttpServer())
    .get('/api/v1/merchant/leads')
    .set('Authorization', `Bearer ${merchantToken}`)
    .expect(200);
  expect(leads.body.data.some((l) => l.source === 'DISTRIBUTOR_QR')).toBe(true);
});
```

- [ ] **Step 2: Run test — expect FAIL**

- [ ] **Step 3: Implement QR token generation (HMAC JWT, 7-day expiry)**

```typescript
generateQrToken(distributorId: string, tenantId: string, bindType: BindType) {
  const token = this.jwt.sign(
    { distributorId, tenantId, bindType, purpose: 'bind' },
    { expiresIn: '7d', secret: process.env.BIND_TOKEN_SECRET },
  );
  await this.prisma.distributorQrCode.create({
    data: { distributorId, token, bindType, expiresAt: addDays(new Date(), 7) },
  });
  return { token, url: `${process.env.MERCHANT_APP_URL}/bind/${token}` };
}
```

- [ ] **Step 4: Implement claim with unique binding constraint**

- [ ] **Step 5: Run tests — expect PASS**

---

### Task 7: packages/ui Shared Shell

**Files:**
- Create: `packages/ui/package.json`, `packages/ui/styles/globals.css`
- Create: `packages/ui/components/shells/admin-shell.tsx`
- Create: `packages/ui/components/shells/merchant-shell.tsx`
- Create: `packages/ui/components/metric-card.tsx`

- [ ] **Step 1: Init shadcn in packages/ui**

Run from `packages/ui`:
```bash
npx shadcn@latest init
npx shadcn@latest add button card badge table sidebar skeleton sonner dropdown-menu tabs separator avatar sheet dialog form input select
```

- [ ] **Step 2: Copy globals.css tokens from docs/design/design-system.md**

- [ ] **Step 3: Build AdminShell per docs/design/phase-1-admin.md**

- [ ] **Step 4: Build MerchantShell per docs/design/phase-1-merchant.md**

- [ ] **Step 5: Export from packages/ui index**

---

### Task 8: Admin Portal UI

**Files:**
- Create: `apps/admin/` via `pnpm create next-app`
- Create: login, dashboard, merchants list, merchant detail pages

- [ ] **Step 1: Scaffold Next.js app on port 3000**

- [ ] **Step 2: Implement login page per docs/design/phase-1-admin.md**

- [ ] **Step 3: Implement merchants DataTable with status filters**

- [ ] **Step 4: Implement approve/reject dialogs**

- [ ] **Step 5: Wire to API with cookie-based auth**

---

### Task 9: Merchant Portal UI

**Files:**
- Create: `apps/merchant/` via `pnpm create next-app`
- Create: register wizard, CRM pages, distributors, bind page

- [ ] **Step 1: Scaffold Next.js app on port 3002**

- [ ] **Step 2: Implement 3-step register wizard**

- [ ] **Step 3: Implement CRM CRUD pages with Sheet forms**

- [ ] **Step 4: Implement distributor detail with QR display (qrcode library)**

- [ ] **Step 5: Implement mobile-first bind page per docs/design/phase-1-merchant.md**

---

### Task 10: Docker Compose

**Files:**
- Create: `docker/docker-compose.yml`
- Create: `apps/api/Dockerfile`, `apps/admin/Dockerfile`, `apps/merchant/Dockerfile`
- Create: `.env.example`

- [ ] **Step 1: Write docker-compose.yml**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    ports: ["5432:5432"]
    environment:
      POSTGRES_USER: meridian
      POSTGRES_PASSWORD: meridian
      POSTGRES_DB: meridian
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U meridian"]
      interval: 5s

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  api:
    build: ../apps/api
    ports: ["3001:3001"]
    depends_on:
      postgres: { condition: service_healthy }
    env_file: ../.env

  admin:
    build: ../apps/admin
    ports: ["3000:3000"]
    depends_on: [api]

  merchant:
    build: ../apps/merchant
    ports: ["3002:3002"]
    depends_on: [api]

profiles: [dev]
```

- [ ] **Step 2: Write .env.example with all required vars**

- [ ] **Step 3: Verify full stack**

Run: `docker compose --profile dev up`  
Expected: all services healthy, admin login works

---

### Task 11: E2E Smoke Tests

**Files:**
- Create: `e2e/phase-1.spec.ts`

- [ ] **Step 1: Write Playwright test**

```typescript
test('admin login and view merchants', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await page.fill('[name=email]', 'admin@meridian.test');
  await page.fill('[name=password]', 'admin123');
  await page.click('button[type=submit]');
  await expect(page).toHaveURL('/');
  await page.goto('/merchants');
  await expect(page.getByRole('heading', { name: 'Merchants' })).toBeVisible();
});
```

- [ ] **Step 2: Run against Docker stack**

Run: `pnpm test:e2e`  
Expected: PASS

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2025-06-24-phase-1-foundation.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks
2. **Inline Execution** — execute tasks in this session using executing-plans with checkpoints

Which approach?
