import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { locales, localeTags, translate } from "../../src/lib/i18n/messages";
try {
  process.loadEnvFile(".env");
} catch {}
const database = new URL(process.env.DATABASE_URL ?? "");
if (
  database.protocol !== "mongodb:" ||
  !["127.0.0.1", "localhost"].includes(database.hostname) ||
  !/^civicbridge_(?:upgrade_test|test|ci)(?:_[a-z0-9]+)?$/.test(database.pathname.slice(1))
)
  throw new Error("Redesign tests require an isolated local test database.");
const db = new PrismaClient();
const prefix = "regional-" + Date.now();
const origin = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
test.beforeEach(async ({ request }) => {
  const health = await (await request.get("/api/health")).json();
  expect(health.testDatabase).toBe(database.pathname.slice(1));
});
test("all six interface languages persist through navigation and reload without overflow", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const locale of locales) {
    await page.goto("/");
    await page.locator(".language-picker select").selectOption(locale);
    await expect(page.locator("main h1")).toHaveText(
      translate("Better neighbourhoods start with you.", locale),
    );
    await expect(page.locator("html")).toHaveAttribute("lang", localeTags[locale]);
    for (const width of [320, 390, 768, 1280]) {
      await page.setViewportSize({ width, height: 844 });
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        locale + " at " + width,
      ).toBe(true);
    }
    await page.goto("/app");
    await expect(
      page.getByRole("heading", { name: translate("Community", locale), exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", localeTags[locale]);
  }
  expect(errors).toEqual([]);
});
test("regional form values survive language changes and back navigation, while API enums stay stable", async ({
  page,
  context,
}) => {
  const email = prefix + "@example.test",
    password = "RegionalTesting@2026";
  const registration = await context.request.post("/api/platform/register", {
    data: { name: "Regional Test Citizen", email, password, role: "CITIZEN" },
    headers: { Origin: origin },
  });
  expect(registration.status()).toBe(201);
  const { csrfToken } = await (await context.request.get("/api/auth/csrf")).json();
  await context.request.post("/api/auth/callback/credentials", {
    form: { csrfToken, email, password, callbackUrl: origin + "/app" },
    headers: { "X-Auth-Return-Redirect": "1" },
  });
  await context.addCookies([{ name: "civicbridge_locale", value: "hi", url: origin }]);
  await page.goto("/problems/new");
  const title = prefix + " विद्यालय के पास टूटा हुआ फुटपाथ";
  const description =
    "विद्यालय के सामने फुटपाथ में टूटे हुए पत्थर और बड़े गड्ढे हैं। बच्चों और बुजुर्गों को प्रतिदिन सुरक्षित चलने में कठिनाई होती है।";
  await page.getByLabel(translate("Problem title", "hi"), { exact: true }).fill(title);
  await page.getByLabel(translate("What’s happening?", "hi")).fill(description);
  await page
    .getByLabel(translate("Category", "hi"), { exact: true })
    .selectOption("Infrastructure");
  await page.locator(".language-picker select").selectOption("mr");
  await expect(page.getByLabel(translate("Problem title", "mr"), { exact: true })).toHaveValue(
    title,
  );
  await expect(page.getByLabel(translate("Category", "mr"), { exact: true })).toHaveValue(
    "Infrastructure",
  );
  await page.getByRole("button", { name: translate("Continue", "mr"), exact: true }).click();
  await page.getByLabel(translate("State / union territory", "mr")).fill("महाराष्ट्र");
  await page.getByLabel(translate("City / village", "mr")).fill("पुणे");
  await page.getByLabel(translate("Area / locality", "mr")).fill("विद्यालय मार्ग");
  await page.getByRole("button", { name: translate("Continue", "mr"), exact: true }).click();
  await page.locator(".language-picker select").selectOption("ta");
  await expect(page.locator(".wizard-summary h3")).toHaveText(title);
  await page.getByRole("button", { name: translate("Back", "ta"), exact: true }).click();
  await expect(page.getByLabel(translate("City / village", "ta"))).toHaveValue("पुणे");
  await page.getByRole("button", { name: translate("Continue", "ta"), exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
  await page.getByRole("button", { name: translate("Submit report", "ta"), exact: true }).click();
  await page.waitForURL(
    (url) => url.pathname !== "/problems/new" && /^\/problems\/[^/]+$/.test(url.pathname),
  );
  const row = await db.problem.findUniqueOrThrow({ where: { id: page.url().split("/").pop()! } });
  expect(row).toMatchObject({
    title,
    description,
    category: "Infrastructure",
    city: "पुणे",
    status: "REPORTED",
  });
});
test("redesigned public pages fit phone screens and preserve keyboard navigation", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of [
    "/",
    "/app",
    "/explore",
    "/innovations",
    "/impact",
    "/evidence",
    "/intelligence",
    "/login",
    "/register",
  ]) {
    await page.goto(route);
    await expect(page.locator("main")).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      route,
    ).toBe(true);
  }
  await page.goto("/explore");
  await page.getByRole("button", { name: "More filters", exact: true }).click();
  await expect(page.getByLabel("City", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Toggle navigation", exact: true }).click();
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("navigation", { name: "Main navigation" })).not.toBeVisible();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page.screenshot({ path: "test-results/redesigned-website.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/app");
  await expect(page.locator(".app-post").first()).toBeVisible();
  await page.screenshot({ path: "test-results/redesigned-app.png" });
  expect(errors).toEqual([]);
});
test.afterAll(async () => {
  const users = await db.user.findMany({
      where: { email: { startsWith: prefix } },
      select: { id: true },
    }),
    ids = users.map((u) => u.id);
  if (ids.length)
    await db.$transaction(async (tx) => {
      const rows = await tx.problem.findMany({
          where: { authorId: { in: ids } },
          select: { id: true },
        }),
        pids = rows.map((p) => p.id);
      await tx.auditLog.deleteMany({
        where: { OR: [{ actorId: { in: ids } }, { entityId: { in: pids } }] },
      });
      await tx.notification.deleteMany({
        where: {
          OR: [{ userId: { in: ids } }, { href: { in: pids.map((id) => "/problems/" + id) } }],
        },
      });
      await tx.problem.deleteMany({ where: { id: { in: pids } } });
      await tx.user.deleteMany({ where: { id: { in: ids } } });
    });
  await db.$disconnect();
});
