import { test, expect, request, type APIRequestContext } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { createHash } from "node:crypto";
try {
  process.loadEnvFile(".env");
} catch {}
const target = new URL(process.env.DATABASE_URL ?? "");
if (
  target.protocol !== "mongodb:" ||
  !["127.0.0.1", "localhost"].includes(target.hostname) ||
  !/^civicbridge_(?:upgrade_test|test|ci)(?:_[a-z0-9]+)?$/.test(target.pathname.slice(1))
)
  throw new Error("Native session tests require an isolated local database.");
const db = new PrismaClient();
const baseURL = process.env.TEST_BASE_URL ?? "http://127.0.0.1:3000";
const prefix = `native-${Date.now()}`;
const password = "NativeTesting@2026";
const users: string[] = [];
let client: APIRequestContext;
const digest = (token: string) => createHash("sha256").update(token).digest("hex");
test.beforeAll(async () => {
  client = await request.newContext({
    baseURL,
    extraHTTPHeaders: { "X-CivicBridge-Client": "native" },
  });
  const health = await (await client.get("/api/health")).json();
  expect(health.testDatabase).toBe(target.pathname.slice(1));
});
async function register(role: "CITIZEN" | "RESEARCHER") {
  const email = `${prefix}-${role.toLowerCase()}@example.test`;
  const res = await client.post("/api/mobile/register", {
    data: { name: `Native ${role}`, email, password, role },
  });
  expect(res.status(), await res.text()).toBe(201);
  const user = await res.json();
  users.push(user.id);
  return { email, user };
}
async function login(email: string) {
  const response = await client.post("/api/mobile/session", { data: { email, password } });
  expect(response.status(), await response.text()).toBe(201);
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect(response.headers()["set-cookie"]).toBeUndefined();
  return response.json();
}
test("native bearer sessions post private reports/uploads and enforce role, expiry and revocation", async () => {
  const citizen = await register("CITIZEN");
  const invalid = await client.post("/api/mobile/session", {
    data: { email: citizen.email, password: "incorrect" },
  });
  expect(invalid.status()).toBe(401);
  const session = await login(citizen.email);
  expect(session).not.toHaveProperty("user.passwordHash");
  const stored = await db.mobileSession.findUniqueOrThrow({
    where: { tokenHash: digest(session.token) },
  });
  expect(stored.userId).toBe(citizen.user.id);
  expect(JSON.stringify(stored)).not.toContain(session.token);
  const headers = { Authorization: `Bearer ${session.token}` };
  expect((await client.get("/api/mobile/session", { headers })).status()).toBe(200);
  const upload = await client.post("/api/uploads", {
    headers,
    multipart: {
      file: {
        name: "native.png",
        mimeType: "image/png",
        buffer: Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aM1sAAAAASUVORK5CYII=",
          "base64",
        ),
      },
    },
  });
  expect(upload.status(), await upload.text()).toBe(201);
  const file = await upload.json();
  const report = await client.post("/api/platform/problems", {
    headers,
    data: {
      title: prefix + " unsafe road outside the school",
      description:
        "Broken pavement and uncovered drains outside the local school endanger children and older residents every day.",
      category: "Infrastructure",
      urgency: "HIGH",
      state: "Maharashtra",
      city: "Pune",
      area: "School lane",
      latitude: 18.52,
      longitude: 73.85,
      population: 100,
      imageIds: [file.id],
    },
  });
  expect(report.status(), await report.text()).toBe(201);
  const problem = await report.json();
  expect(problem.authorId).toBe(citizen.user.id);
  expect(problem.status).toBe("REPORTED");
  expect((await client.get(`/api/platform/problems/${problem.id}`, { headers })).status()).toBe(
    200,
  );
  expect((await client.get(`/api/platform/problems/${problem.id}`)).status()).toBe(404);
  expect((await client.get(`/api/files/${file.id}`)).status()).not.toBe(200);
  expect((await client.post("/api/platform/proposals", { headers, data: {} })).status()).toBe(403);
  expect(
    (
      await client.patch("/api/platform/notifications", {
        headers: { ...headers, Origin: "https://untrusted.example" },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await client.post("/api/platform/problems", {
        headers: { Authorization: "Bearer cbm_" + "x".repeat(43) },
        data: {},
      })
    ).status(),
  ).toBe(403);
  expect((await client.delete("/api/mobile/session", { headers })).status()).toBe(204);
  expect((await client.get("/api/mobile/session", { headers })).status()).toBe(401);
  const expired = await login(citizen.email);
  await db.mobileSession.update({
    where: { tokenHash: digest(expired.token) },
    data: { expiresAt: new Date(Date.now() - 1000) },
  });
  expect(
    (
      await client.get("/api/mobile/session", {
        headers: { Authorization: `Bearer ${expired.token}` },
      })
    ).status(),
  ).toBe(401);
  const active = await login(citizen.email);
  await db.user.update({ where: { id: citizen.user.id }, data: { active: false } });
  expect(
    (
      await client.get("/api/mobile/session", {
        headers: { Authorization: `Bearer ${active.token}` },
      })
    ).status(),
  ).toBe(401);
});
test("a native researcher can submit a solution without browser cookies", async () => {
  const researcher = await register("RESEARCHER");
  const session = await login(researcher.email);
  const open = await db.problem.findFirstOrThrow({ where: { status: "OPEN" } });
  const response = await client.post("/api/platform/proposals", {
    headers: { Authorization: `Bearer ${session.token}` },
    data: {
      problemId: open.id,
      title: prefix + " practical pilot",
      approach:
        "Run a small community pilot, measure baseline service availability, and review the results with local residents before expansion.",
      techStack: "Field surveys and low-cost sensors",
      feasibility: "A six-week pilot with weekly volunteer meetings and maintenance.",
      resources: "Volunteer time and sensor kits.",
      impact: "Measure and improve reliability of essential services for local residents.",
      imageIds: [],
    },
  });
  expect(response.status(), await response.text()).toBe(201);
  expect((await response.json()).authorId).toBe(researcher.user.id);
  expect((await client.post("/api/mobile/register", { data: { role: "ADMIN" } })).status()).toBe(
    400,
  );
  expect(
    (
      await client.post("/api/mobile/session", {
        headers: { Origin: "https://untrusted.example" },
        data: { email: researcher.email, password },
      })
    ).status(),
  ).toBe(403);
});
test.afterAll(async () => {
  if (users.length)
    await db.$transaction(async (tx) => {
      const problems = await tx.problem.findMany({
        where: { authorId: { in: users } },
        select: { id: true },
      });
      const proposals = await tx.solutionProposal.findMany({
        where: { authorId: { in: users } },
        select: { id: true },
      });
      const ids = [...problems, ...proposals].map((p) => p.id);
      await tx.notification.deleteMany({
        where: {
          OR: [
            { userId: { in: users } },
            { href: { in: ids.flatMap((id) => [`/problems/${id}`, `/innovations/${id}`]) } },
          ],
        },
      });
      await tx.auditLog.deleteMany({
        where: { OR: [{ actorId: { in: users } }, { entityId: { in: ids } }] },
      });
      await tx.problemImage.deleteMany({ where: { ownerId: { in: users } } });
      await tx.solutionProposal.deleteMany({ where: { authorId: { in: users } } });
      await tx.problem.deleteMany({ where: { authorId: { in: users } } });
      await tx.mobileSession.deleteMany({ where: { userId: { in: users } } });
      await tx.user.deleteMany({ where: { id: { in: users } } });
    });
  await client?.dispose();
  await db.$disconnect();
});
