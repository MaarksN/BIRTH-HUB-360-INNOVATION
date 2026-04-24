import { defineConfig } from "@playwright/test";

const port = Number.parseInt(process.env.PLAYWRIGHT_PORT ?? "3001", 10);
const apiPort = Number.parseInt(process.env.PLAYWRIGHT_API_PORT ?? "3400", 10);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;
const apiBaseURL = process.env.PLAYWRIGHT_API_BASE_URL ?? `http://127.0.0.1:${apiPort}`;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 90_000,
  use: {
    baseURL,
    locale: "pt-BR",
    trace: "retain-on-failure"
  },
  webServer: [
    {
      command: `node tests/e2e/mock-api-server.mjs`,
      env: {
        ...process.env,
        PLAYWRIGHT_API_PORT: String(apiPort)
      },
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      url: `${apiBaseURL}/api/v1/me`
    },
    {
      command: `pnpm --filter @birthub/web exec next dev --webpack -p ${port}`,
      env: {
        ...process.env,
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? apiBaseURL,
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? baseURL,
        NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT ?? "test",
        NEXT_TELEMETRY_DISABLED: process.env.NEXT_TELEMETRY_DISABLED ?? "1",
        WEB_BASE_URL: process.env.WEB_BASE_URL ?? baseURL
      },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      url: baseURL
    }
  ]
});
