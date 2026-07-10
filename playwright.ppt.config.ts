import { defineConfig, devices } from "@playwright/test";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const ADMIN_URL = process.env.ADMIN_APP_URL ?? "http://localhost:3000";
const STORE_URL = process.env.STORE_APP_URL ?? "http://localhost:3003";
const MERCHANT_URL = process.env.MERCHANT_APP_URL ?? "http://localhost:3002";
const DISTRIBUTOR_URL =
  process.env.DISTRIBUTOR_APP_URL ?? "http://localhost:3005";
const LANDING_URL = process.env.LANDING_APP_URL ?? "http://localhost:3004";

export default defineConfig({
  testDir: "./PPT",
  testMatch: /capture-screenshots\.spec\.ts/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  timeout: 180_000,
  use: {
    ...devices["Desktop Chrome"],
    viewport: { width: 1280, height: 720 },
    screenshot: "off",
    trace: "off",
    video: "off",
  },
  webServer: process.env.CI
    ? undefined
    : [
        {
          command: "pnpm --filter @meridian/api start:dev",
          url: `${API_URL}/api/v1/health`,
          reuseExistingServer: true,
          timeout: 120_000,
        },
        {
          command: "pnpm --filter @meridian/landing dev",
          url: LANDING_URL,
          reuseExistingServer: true,
          timeout: 120_000,
        },
        {
          command: "pnpm --filter @meridian/admin dev",
          url: ADMIN_URL,
          reuseExistingServer: true,
          timeout: 120_000,
        },
        {
          command: "pnpm --filter @meridian/store dev",
          url: STORE_URL,
          reuseExistingServer: true,
          timeout: 120_000,
        },
        {
          command: "pnpm --filter @meridian/merchant dev",
          url: MERCHANT_URL,
          reuseExistingServer: true,
          timeout: 120_000,
        },
        {
          command: "pnpm --filter @meridian/distributor dev",
          url: DISTRIBUTOR_URL,
          reuseExistingServer: true,
          timeout: 120_000,
        },
      ],
});
