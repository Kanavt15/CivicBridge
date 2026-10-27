import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/sync",
  workers: 1,
  timeout: 120000,
  reporter: "list",
  outputDir: "test-results/sync",
  use: {
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
