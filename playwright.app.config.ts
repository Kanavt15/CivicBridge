import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  workers: 1,
  fullyParallel: false,
  timeout: 90000,
  reporter: "list",
  use: {
    actionTimeout: 15000,
    baseURL: process.env.TEST_BASE_URL || "http://127.0.0.1:3000",
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    serviceWorkers: "allow",
    screenshot: "only-on-failure",
    ...(process.platform === "win32" ? { channel: "msedge" } : {}),
  },
  webServer: process.env.TEST_BASE_URL
    ? undefined
    : {
        command: `${process.platform === "win32" ? "npm.cmd" : "npm"} run start`,
        url: "http://127.0.0.1:3000",
        reuseExistingServer: false,
        env: { CIVICBRIDGE_TEST_MODE: "true" },
        timeout: 120000,
      },
});
