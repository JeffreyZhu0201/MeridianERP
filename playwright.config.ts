import { defineConfig, devices } from '@playwright/test';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const ADMIN_URL = process.env.ADMIN_APP_URL ?? 'http://localhost:3000';
const STORE_URL = process.env.STORE_APP_URL ?? 'http://localhost:3003';

const MERCHANT_URL = process.env.MERCHANT_APP_URL ?? 'http://localhost:3002';
const DISTRIBUTOR_URL = process.env.DISTRIBUTOR_APP_URL ?? 'http://localhost:3005';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: process.env.CI ? 'github' : [['html', { open: 'never' }]],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'admin',
      testMatch: /phase-1\.spec\.ts|merchant-plugins-admin\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], baseURL: ADMIN_URL },
    },
    {
      name: 'store',
      testMatch: /phase-2-store\.spec\.ts|gaps-store\.spec\.ts|i18n-locale\.spec\.ts/,
      grepInvert: /@merchant-app/,
      use: { ...devices['Desktop Chrome'], baseURL: STORE_URL },
    },
    {
      name: 'merchant',
      testMatch: /phase-3-inventory\.spec\.ts|i18n-locale\.spec\.ts|merchant-plugins\.spec\.ts/,
      grepInvert: /@store-app/,
      use: { ...devices['Desktop Chrome'], baseURL: MERCHANT_URL },
    },
    {
      name: 'distributor',
      testMatch: /distributor-portal\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], baseURL: DISTRIBUTOR_URL },
    },
  ],
  webServer: process.env.CI
    ? undefined
    : [
        {
          command: 'pnpm --filter @meridian/api start:dev',
          url: `${API_URL}/api/v1/health`,
          reuseExistingServer: true,
          timeout: 120_000,
        },
        {
          command: 'pnpm --filter @meridian/admin dev',
          url: ADMIN_URL,
          reuseExistingServer: true,
          timeout: 120_000,
        },
        {
          command: 'pnpm --filter @meridian/store dev',
          url: STORE_URL,
          reuseExistingServer: true,
          timeout: 120_000,
        },
        {
          command: 'pnpm --filter @meridian/merchant dev',
          url: MERCHANT_URL,
          reuseExistingServer: true,
          timeout: 120_000,
        },
        {
          command: 'pnpm --filter @meridian/distributor dev',
          url: DISTRIBUTOR_URL,
          reuseExistingServer: true,
          timeout: 120_000,
        },
      ],
});
