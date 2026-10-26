import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/native",
  workers: 1,
  timeout: 60000,
  reporter: "list",
  outputDir: "test-results/native",
  use: {
    baseURL: "http://127.0.0.1:8083",
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    screenshot: "only-on-failure",
    ...(process.platform === "win32" ? { channel: "msedge" } : {}),
  },
  webServer: {
    command: "node mobile/scripts/serve-preview.mjs",
    url: "http://127.0.0.1:8083",
    reuseExistingServer: false,
  },
});
