import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/integration",
  workers: 1,
  fullyParallel: false,
  timeout: 120000,
  reporter: "list",
  use: { baseURL: process.env.TEST_BASE_URL || "http://127.0.0.1:3000" },
  webServer: process.env.TEST_BASE_URL
    ? undefined
    : {
        command: `${process.platform === "win32" ? "npm.cmd" : "npm"} run ${process.env.E2E_SERVER_MODE === "production" ? "start" : "dev"}`,
        url: "http://127.0.0.1:3000",
        reuseExistingServer: false,
        env: { CIVICBRIDGE_TEST_MODE: "true" },
        timeout: 120000,
      },
});
