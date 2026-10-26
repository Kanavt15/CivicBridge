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
  throw new Error("Browser posting tests require an isolated local test database.");
const db = new PrismaClient();
const prefix = `mobile-${Date.now()}`;
const password = "MobileTesting@2026";
const origin = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
const users: string[] = [],
  problems: string[] = [],
  proposals: string[] = [];
test.beforeEach(async ({ request }) => {
  const health = await (await request.get("/api/health")).json();
  expect(
    health.testDatabase,
    "The running server must identify the same disposable database before browser writes.",
  ).toBe(database.pathname.slice(1));
});
async function signInAs(context: BrowserContext, role: "CITIZEN" | "RESEARCHER") {
  const email = `${prefix}-${role.toLowerCase()}@example.test`;
  const registered = await context.request.post("/api/platform/register", {
    data: { email, name: `Mobile ${role}`, password, role },
    headers: { Origin: origin },
  });
  expect(registered.status(), await registered.text()).toBe(201);
  const user = await db.user.findUniqueOrThrow({ where: { email } });
  users.push(user.id);
  const { csrfToken } = await (await context.request.get("/api/auth/csrf")).json();
  const login = await context.request.post("/api/auth/callback/credentials", {
    form: { csrfToken, email, password, callbackUrl: `${origin}/app` },
    headers: { "X-Auth-Return-Redirect": "1" },
  });
  expect(login.ok()).toBe(true);
}
test("shows an installable mobile feed, filters both post types, and fits small screens", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/app");
  await expect(page.getByRole("heading", { name: /Notice a problem/ })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "App navigation" })).toBeVisible();
  await page.getByRole("button", { name: "How to install" }).click();
  await expect(page.getByText(/On iPhone, open the site in Safari/)).toBeVisible();
  const manifest = await (await page.request.get("/manifest.webmanifest")).json();
  expect(manifest.start_url).toBe("/app");
  expect(manifest.display).toBe("standalone");
  const icon = await page.request.get("/icons/app-512.png");
  expect(icon.status()).toBe(200);
  expect((await icon.body()).readUInt32BE(16)).toBe(512);
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      `horizontal overflow at ${width}px`,
    ).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Solutions", exact: true }).click();
  await expect(page.getByText(/Showing up to 100/)).toBeVisible();
  await page
    .getByRole("searchbox", { name: "Search community posts" })
    .fill("no-such-community-post-xyzzy");
  await expect(page.getByRole("heading", { name: "Nothing here yet" })).toBeVisible();
  await page.getByRole("button", { name: "Problems", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Nothing here yet" })).toBeVisible();
  expect(errors).toEqual([]);
  await page.getByRole("searchbox").clear();
  await page.screenshot({ path: "test-results/community-app-mobile.png", fullPage: true });
});
test("a citizen posts a real problem from a phone form using a mocked location", async ({
  page,
  context,
}) => {
  await signInAs(context, "CITIZEN");
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "geolocation", {
      value: {
        getCurrentPosition: (success: PositionCallback) =>
          success({
            coords: {
              latitude: 18.5204,
              longitude: 73.8567,
              accuracy: 20,
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null,
            },
            timestamp: Date.now(),
          } as GeolocationPosition),
      },
    });
  });
  await page.goto("/app");
  await page.getByRole("link", { name: /Post a problem A photo/ }).click();
  await page
    .getByLabel("Problem title", { exact: true })
    .fill(`${prefix} unsafe pavement near the school`);
  await page
    .getByLabel("What’s happening?")
    .fill(
      "The pavement outside the community school has broken slabs and unsafe gaps that affect children and older residents every day.",
    );
  await page.getByLabel("Category", { exact: true }).selectOption("Infrastructure");
  await page.getByLabel("State / union territory").fill("Maharashtra");
  await page.getByLabel("City / village").fill("Pune");
  await page.getByLabel("Area / locality").fill("School lane");
  await page.getByRole("button", { name: "Use my current location" }).click();
  await expect(page.getByLabel("Latitude", { exact: true })).toHaveValue("18.5204");
  await expect(page.getByLabel("Longitude", { exact: true })).toHaveValue("73.8567");
  await expect(page.getByLabel("Take a photo of the problem")).toHaveAttribute(
    "capture",
    "environment",
  );
  await page.getByRole("button", { name: "Submit report", exact: true }).click();
  await page.waitForURL(
    (url) => url.pathname !== "/problems/new" && /^\/problems\/[^/]+$/.test(url.pathname),
  );
  const id = page.url().split("/").pop()!;
  problems.push(id);
  expect(await db.problem.findUniqueOrThrow({ where: { id } })).toMatchObject({
    status: "REPORTED",
    latitude: 18.5204,
    longitude: 73.8567,
  });
});
test("a researcher posts a real solution from the phone app", async ({ page, context }) => {
  await signInAs(context, "RESEARCHER");
  const open = await db.problem.findFirstOrThrow({
    where: { status: "OPEN" },
    select: { id: true },
  });
  await page.goto(`/solutions/new?problem=${open.id}`);
  await page.getByLabel("Solution title").fill(`${prefix} practical community pilot`);
  await page
    .getByLabel("Your proposed approach")
    .fill(
      "Build and evaluate a small community pilot with local volunteers, collect baseline readings, and review the results before expanding.",
    );
  await page.getByLabel("Technology and methods").fill("Low-cost sensors and field surveys");
  await page
    .getByLabel("Expected impact")
    .fill(
      "Reduce the burden on local residents through a measurable improvement in reliable community services.",
    );
  await page
    .getByLabel("Feasibility and implementation")
    .fill("Run a six-week volunteer pilot with weekly maintenance and review meetings.");
  await page
    .getByLabel("Resources needed")
    .fill("Volunteer time, sensor kits, and permission for a pilot site.");
  await page.getByRole("button", { name: "Submit proposal", exact: true }).click();
  await page.waitForURL(/\/innovations\/[a-z0-9]+$/);
  const id = page.url().split("/").pop()!;
  proposals.push(id);
  expect(await db.solutionProposal.findUniqueOrThrow({ where: { id } })).toMatchObject({
    status: "SUBMITTED",
    problemId: open.id,
  });
});
test("the service worker provides a generic offline screen without caching private data", async ({
  page,
  context,
}) => {
  await page.goto("/app");
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await expect
    .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
    .toBe(true);
  const cached = await page.evaluate(async () => {
    const keys = await caches.keys();
    const urls: string[] = [];
    for (const key of keys.filter((k) => k.startsWith("civicbridge-public-shell-"))) {
      const cache = await caches.open(key);
      for (const req of await cache.keys()) urls.push(new URL(req.url).pathname);
    }
    return urls;
  });
  expect(cached.sort()).toEqual(
    ["/icons/app-192.png", "/icons/app-512.png", "/offline.html"].sort(),
  );
  try {
    await context.setOffline(true);
    await page.goto("/not-cached-private-workspace");
    await expect(page.getByRole("heading", { name: /Your community will be here/ })).toBeVisible();
    expect(
      await page.evaluate(() =>
        fetch("/api/platform/me").then(
          () => false,
          () => true,
        ),
      ),
    ).toBe(true);
    await expect(
      page.getByText("Nothing has been queued or submitted.", { exact: false }),
    ).toBeVisible();
  } finally {
    await context.setOffline(false);
  }
});
test.afterAll(async () => {
  // Remove only records belonging to this exact browser-test run.
  const ownedProblems = await db.problem.findMany({
    where: { authorId: { in: users } },
    select: { id: true },
  });
  const ownedProposals = await db.solutionProposal.findMany({
    where: { authorId: { in: users } },
    select: { id: true },
  });
  const pids = ownedProblems.map((p) => p.id),
    sids = ownedProposals.map((p) => p.id);
  await db.$transaction(async (tx) => {
    await tx.auditLog.deleteMany({
      where: { OR: [{ actorId: { in: users } }, { entityId: { in: [...pids, ...sids] } }] },
    });
    await tx.notification.deleteMany({
      where: {
        OR: [
          { userId: { in: users } },
          {
            href: {
              in: [
                ...pids.map((id) => `/problems/${id}`),
                ...sids.map((id) => `/innovations/${id}`),
              ],
            },
          },
        ],
      },
    });
    await tx.problemImage.deleteMany({ where: { ownerId: { in: users } } });
    await tx.solutionProposal.deleteMany({ where: { id: { in: sids } } });
    await tx.problem.deleteMany({ where: { id: { in: pids } } });
    await tx.user.deleteMany({ where: { id: { in: users } } });
  });
  await db.$disconnect();
});
