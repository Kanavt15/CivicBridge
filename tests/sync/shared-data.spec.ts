import { test, expect, type BrowserContext } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
try {
  process.loadEnvFile(".env");
} catch {}
const database = new URL(process.env.DATABASE_URL ?? "");
if (
  database.protocol !== "mongodb:" ||
  !["127.0.0.1", "localhost"].includes(database.hostname) ||
  !/^civicbridge_(?:upgrade_test|test|ci)(?:_[a-z0-9]+)?$/.test(database.pathname.slice(1))
)
  throw new Error("Shared-data tests require an isolated loopback database, never Atlas.");
const base = process.env.TEST_BASE_URL;
if (!base || !["127.0.0.1", "localhost"].includes(new URL(base).hostname))
  throw new Error("Set TEST_BASE_URL to the isolated local server.");
const db = new PrismaClient();
const prefix = "sync-" + Date.now();
const email = prefix + "@example.test",
  password = "SharedData@Test2026";
let userId = "";
async function browserLogin(context: BrowserContext, email: string, password: string) {
  const { csrfToken } = await (await context.request.get(base + "/api/auth/csrf")).json();
  await context.request.post(base + "/api/auth/callback/credentials", {
    form: { csrfToken, email, password, callbackUrl: base + "/app" },
    headers: { Origin: base!, "X-Auth-Return-Redirect": "1" },
  });
}
test("native app and website share records and refresh each other's changes without page reloads", async ({
  browser,
  page: native,
  request,
}) => {
  const health = await (await request.get(base + "/api/health")).json();
  expect(health.testDatabase).toBe(database.pathname.slice(1));
  const registered = await request.post(base + "/api/platform/register", {
    headers: { Origin: base! },
    data: { name: "Shared Data Citizen", email, password, role: "CITIZEN" },
  });
  expect(registered.status()).toBe(201);
  userId = (await registered.json()).id;
  const web = await browser.newPage();
  const publicWeb = await browser.newPage();
  const publicHome = await browser.newPage();
  const admin = await browser.newContext();
  try {
    await browserLogin(web.context(), email, password);
    await browserLogin(
      admin,
      "admin@demo.civicbridge.in",
      process.env.DEMO_PASSWORD || "CivicBridge@2026",
    );
    // The browser preview proxies native requests to the real isolated backend.
    // Native phones send no browser Origin; the preview supplies the allowed
    // test origin. No API results or mutations are mocked in this test.
    await native.route("https://civicbridge.example.test/api/**", async (route) => {
      const original = route.request();
      const url = new URL(original.url());
      if (original.method() === "OPTIONS") {
        await route.fulfill({
          status: 204,
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-headers": "*",
            "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
          },
        });
        return;
      }
      const response = await route.fetch({
        url: base + url.pathname + url.search,
        headers: { ...original.headers(), origin: base!, host: new URL(base!).host },
      });
      await route.fulfill({
        response,
        headers: { ...response.headers(), "access-control-allow-origin": "*" },
      });
    });
    await web.goto(base + "/app/activity");
    await expect(web.locator("main")).toContainText("Shared Data Citizen");
    await publicWeb.goto(base + "/explore");
    await publicHome.goto(base!);
    const homeCount = publicHome
      .getByRole("region", { name: "Platform statistics" })
      .locator("strong")
      .first();
    const initialPublicCount = Number(await homeCount.textContent());
    await native.goto("http://127.0.0.1:8083/");
    await native.getByRole("button", { name: "Post a problem", exact: true }).click();
    await native.getByLabel("Email address", { exact: true }).fill(email);
    await native.getByLabel("Password", { exact: true }).fill(password);
    await native.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(native).toHaveURL(/\/activity$/);
    await native.goBack();
    await native.getByRole("button", { name: "Post a problem", exact: true }).click();
    const title = prefix + " broken footpath outside the school";
    await native.getByLabel("Problem title", { exact: true }).fill(title);
    await native
      .getByLabel("What’s happening?", { exact: true })
      .fill(
        "Broken slabs and an uncovered drain outside the school endanger children and older residents every day.",
      );
    await native.getByRole("button", { name: "Continue", exact: true }).click();
    await native.getByLabel("State / union territory").fill("Maharashtra");
    await native.getByLabel("City / village").fill("Pune");
    await native.getByLabel("Area / locality").fill("School lane");
    await native.getByLabel("Latitude", { exact: true }).fill("18.52");
    await native.getByLabel("Longitude", { exact: true }).fill("73.85");
    await native.getByRole("button", { name: "Continue", exact: true }).click();
    await native.getByRole("button", { name: "Submit report", exact: true }).click();
    await expect(native).toHaveURL(/\/problems\/[^/]+$/);
    const id = new URL(native.url()).pathname.split("/").pop()!;
    expect(await db.problem.findUniqueOrThrow({ where: { id } })).toMatchObject({
      authorId: userId,
      title,
      status: "REPORTED",
    });
    await expect(web.getByText(title, { exact: true })).toBeVisible({ timeout: 12000 });
    await expect(publicWeb.getByText(title, { exact: true })).toHaveCount(0);
    const fromWeb = "Website update " + prefix;
    expect(
      (
        await web.request.post(base + `/api/platform/problems/${id}/comments`, {
          headers: { Origin: base! },
          data: { body: fromWeb },
        })
      ).status(),
    ).toBe(201);
    await expect(native.getByText(fromWeb, { exact: true })).toBeVisible({ timeout: 12000 });
    await web.goto(base + `/app/problems/${id}`);
    const fromNative = "Native update " + prefix;
    await native.getByLabel("Add a comment", { exact: true }).fill(fromNative);
    await native.getByRole("button", { name: "Post comment", exact: true }).click();
    await expect(web.getByText(fromNative, { exact: true })).toBeVisible({ timeout: 12000 });
    await native.goBack();
    await native.getByRole("tab", { name: "Account", exact: true }).click();
    const profileUpdate = await web.request.patch(base + "/api/platform/profile", {
      headers: { Origin: base! },
      data: {
        name: "Synchronized Citizen",
        bio: "Updated from the website",
        skills: [],
        interests: [],
      },
    });
    expect(profileUpdate.status()).toBe(200);
    await expect(native.getByText("Synchronized Citizen", { exact: true })).toBeVisible({
      timeout: 12000,
    });
    await native.getByRole("tab", { name: "Explore", exact: true }).click();
    await expect(native.getByText(title, { exact: true })).toHaveCount(0);
    for (const status of ["UNDER_REVIEW", "OPEN"]) {
      const result = await admin.request.patch(base + `/api/platform/problems/${id}/status`, {
        headers: { Origin: base! },
        data: { status, note: "Shared client synchronization verification" },
      });
      expect(result.status(), await result.text()).toBe(200);
    }
    await expect(native.getByText(title, { exact: true })).toBeVisible({ timeout: 12000 });
    await expect(publicWeb.getByText(title, { exact: true })).toBeVisible({ timeout: 12000 });
    await expect(homeCount).toHaveText(String(initialPublicCount + 1), { timeout: 12000 });
    await native.screenshot({ path: "test-results/sync/native-shared-record.png" });
    const rejected = await admin.request.patch(base + `/api/platform/problems/${id}/status`, {
      headers: { Origin: base! },
      data: { status: "REJECTED", note: "Remove this synthetic synchronization test record" },
    });
    expect(rejected.status()).toBe(200);
    await expect(native.getByText(title, { exact: true })).toHaveCount(0, { timeout: 12000 });
    await expect(publicWeb.getByText(title, { exact: true })).toHaveCount(0, { timeout: 12000 });
    await expect(homeCount).toHaveText(String(initialPublicCount), { timeout: 12000 });
  } finally {
    await web.close();
    await publicWeb.close();
    await publicHome.close();
    await admin.close();
  }
});
test.afterAll(async () => {
  if (userId)
    await db.$transaction(async (tx) => {
      const records = await tx.problem.findMany({
        where: { authorId: userId },
        select: { id: true },
      });
      const ids = records.map((p) => p.id);
      await tx.notification.deleteMany({
        where: { OR: [{ userId }, { href: { in: ids.map((id) => "/problems/" + id) } }] },
      });
      await tx.auditLog.deleteMany({
        where: { OR: [{ actorId: userId }, { entityId: { in: ids } }] },
      });
      await tx.comment.deleteMany({ where: { problemId: { in: ids } } });
      await tx.problemImage.deleteMany({ where: { ownerId: userId } });
      await tx.problem.deleteMany({ where: { authorId: userId } });
      await tx.mobileSession.deleteMany({ where: { userId } });
      await tx.user.delete({ where: { id: userId } });
    });
  await db.$disconnect();
});
