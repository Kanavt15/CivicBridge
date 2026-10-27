import { test, expect, request, type APIRequestContext } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
try {
  process.loadEnvFile(".env");
} catch {}
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
const testDatabase = new URL(
  process.env.DATABASE_URL ?? "mongodb://127.0.0.1:27018/civicbridge_upgrade_test",
);
if (
  !["127.0.0.1", "localhost"].includes(testDatabase.hostname) ||
  !/^civicbridge_(?:upgrade_test|ci|test)(?:_[a-z0-9]+)?$/.test(testDatabase.pathname.slice(1))
)
  throw new Error(
    "Integration tests require an isolated local civicbridge_test, civicbridge_upgrade_test, or civicbridge_ci database. Never use the Atlas application database.",
  );
const db = new PrismaClient();
const prefix = `e2e-${Date.now()}`;
const password = "Integration@Test2026";
test.beforeAll(async () => {
  const probe = await request.newContext({ baseURL: base });
  try {
    const health = await (await probe.get("/api/health")).json();
    expect(
      health.testDatabase,
      "The server must explicitly use the same isolated test database. Start it with CIVICBRIDGE_TEST_MODE=true; never use the Atlas application server.",
    ).toBe(testDatabase.pathname.slice(1));
  } finally {
    await probe.dispose();
  }
});
test.describe.configure({ mode: "serial" });
let citizen: APIRequestContext,
  researcher: APIRequestContext,
  industry: APIRequestContext,
  admin: APIRequestContext,
  outsider: APIRequestContext;
let reportId = "",
  proposalId = "",
  teamId = "",
  workspaceId = "",
  fileId = "",
  citizenId = "",
  researcherId = "",
  industryId = "";
async function session(email: string, pw: string) {
  const ctx = await request.newContext({ baseURL: base, extraHTTPHeaders: { Origin: base } });
  const csrf = await (await ctx.get("/api/auth/csrf")).json();
  const res = await ctx.post("/api/auth/callback/credentials", {
    form: { csrfToken: csrf.csrfToken, email, password: pw, callbackUrl: `${base}/dashboard` },
    headers: { "X-Auth-Return-Redirect": "1" },
  });
  expect(res.ok()).toBeTruthy();
  const me = await (await ctx.get("/api/platform/me")).json();
  expect(me?.email).toBe(email);
  return ctx;
}
async function register(role: string) {
  const ctx = await request.newContext({ baseURL: base, extraHTTPHeaders: { Origin: base } });
  const email = `${prefix}-${role.toLowerCase()}@example.test`;
  const res = await ctx.post("/api/platform/register", {
    data: {
      name: `Integration ${role}`,
      email,
      password,
      role,
      ...(role === "INDUSTRY" ? { organizationName: `${prefix} Industry`, city: "Pune" } : {}),
    },
  });
  expect(res.status(), await res.text()).toBe(201);
  await ctx.dispose();
  return session(email, password);
}
test.describe.serial("Phase 1 · database, authentication and core workflows", () => {
  test("registers role accounts and authenticates every seeded role", async () => {
    citizen = await register("CITIZEN");
    researcher = await register("RESEARCHER");
    industry = await register("INDUSTRY");
    outsider = await request.newContext({ baseURL: base, extraHTTPHeaders: { Origin: base } });
    const c = await (await citizen.get("/api/platform/me")).json();
    citizenId = c.id;
    const r = await (await researcher.get("/api/platform/me")).json();
    researcherId = r.id;
    industryId = (await (await industry.get("/api/platform/me")).json()).id;
    for (const role of ["citizen", "researcher", "institution", "industry", "admin"]) {
      const ctx = await session(
        `${role}@demo.civicbridge.in`,
        process.env.DEMO_PASSWORD || "CivicBridge@2026",
      );
      if (role === "admin") admin = ctx;
      else await ctx.dispose();
    }
    const bad = await outsider.post("/api/platform/register", {
      data: { name: "Escalation", email: `${prefix}-admin@example.test`, password, role: "ADMIN" },
    });
    expect(bad.status()).toBe(400);
    expect((await outsider.get("/api/dashboard")).status()).toBe(401);
    expect((await citizen.get("/api/platform/admin")).status()).toBe(403);
    const publicProfile = await (await outsider.get(`/api/platform/people/${citizenId}`)).json();
    expect(publicProfile).not.toHaveProperty("email");
    expect(publicProfile).not.toHaveProperty("passwordHash");
  });
  test("uploads validated image data and creates a private, persistent citizen report", async () => {
    const fake = await citizen.post("/api/uploads", {
      multipart: {
        file: { name: "fake.png", mimeType: "image/png", buffer: Buffer.from("this is not a PNG") },
      },
    });
    expect(fake.status()).toBe(400);
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+Xw7sAAAAASUVORK5CYII=",
      "base64",
    );
    const upload = await citizen.post("/api/uploads", {
      multipart: { file: { name: "test.png", mimeType: "image/png", buffer: png } },
    });
    expect(upload.status()).toBe(201);
    fileId = (await upload.json()).id;
    // MongoDB distinguishes missing fields from explicit null; legacy uploads must still attach.
    await db.problemImage.update({
      where: { id: fileId },
      data: { problemId: { unset: true }, proposalId: { unset: true } },
    });
    const report = {
      title: `${prefix} drinking water access`,
      description:
        "Our village faces a severe drinking water shortage during the summer. Local households need rainwater harvesting and reliable monitoring of groundwater availability.",
      category: "Water Conservation",
      urgency: "HIGH",
      state: "Maharashtra",
      city: "Pune",
      area: "Integration test locality",
      latitude: 18.52,
      longitude: 73.85,
      population: 200,
      imageIds: [fileId],
    };
    expect((await outsider.post("/api/platform/problems", { data: report })).status()).toBe(401);
    expect((await researcher.post("/api/platform/problems", { data: report })).status()).toBe(403);
    const created = await citizen.post("/api/platform/problems", { data: report });
    expect(created.status(), await created.text()).toBe(201);
    reportId = (await created.json()).id;
    expect((await outsider.get(`/api/platform/problems/${reportId}`)).status()).toBe(404);
    expect((await outsider.get(`/api/files/${fileId}`)).status()).toBe(404);
    const detail = await (await citizen.get(`/api/platform/problems/${reportId}`)).json();
    expect(detail.status).toBe("REPORTED");
    expect(detail.images[0].id).toBe(fileId);
    expect(detail.author).not.toHaveProperty("email");
    expect(await db.problem.findUnique({ where: { id: reportId } })).not.toBeNull();
    const foreign = await industry.post("/api/platform/problems", { data: report });
    expect(foreign.status()).toBe(403);
  });
  test("enforces admin-only ordered report moderation and updates discovery and dashboards", async () => {
    expect(
      (
        await citizen.patch(`/api/platform/problems/${reportId}/status`, {
          data: { status: "OPEN" },
        })
      ).status(),
    ).toBe(403);
    expect(
      (
        await admin.patch(`/api/platform/problems/${reportId}/status`, {
          data: { status: "RESOLVED" },
        })
      ).status(),
    ).toBe(400);
    for (const status of ["UNDER_REVIEW", "OPEN"]) {
      const res = await admin.patch(`/api/platform/problems/${reportId}/status`, {
        data: { status, note: "Integration review" },
      });
      expect(res.status(), await res.text()).toBe(200);
    }
    expect((await outsider.get(`/api/platform/problems/${reportId}`)).status()).toBe(200);
    expect((await outsider.get(`/api/files/${fileId}`)).status()).toBe(200);
    const filtered = await (
      await outsider.get(
        `/api/platform/problems?q=${prefix}&city=Pune&category=Water%20Conservation&urgency=HIGH&status=OPEN`,
      )
    ).json();
    expect(filtered.items.some((p: any) => p.id === reportId)).toBeTruthy();
    const urgent = await outsider.get("/api/platform/problems?sort=urgent");
    expect(urgent.status()).toBe(200);
    const urgentItems = (await urgent.json()).items;
    const ranks: Record<string, number> = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };
    expect(urgentItems.map((p: any) => ranks[p.urgency])).toEqual(
      urgentItems.map((p: any) => ranks[p.urgency]).sort((a: number, b: number) => b - a),
    );
    const popular = await outsider.get("/api/platform/problems?sort=popular");
    expect(popular.status()).toBe(200);
    const counts = (await popular.json()).items.map((p: any) => p._count.votes);
    expect(counts).toEqual([...counts].sort((a: number, b: number) => b - a));
    const dashboard = await (await citizen.get("/api/dashboard")).json();
    expect(
      dashboard.problems.some((p: any) => p.id === reportId && p.status === "OPEN"),
    ).toBeTruthy();
    expect((await citizen.delete(`/api/platform/problems/${reportId}`)).status()).toBe(403);
    const csrf = await citizen.post(`/api/platform/problems/${reportId}/vote`, {
      headers: { Origin: "https://evil.example" },
    });
    expect(csrf.status()).toBe(403);
    expect(
      (
        await citizen.post(`/api/platform/problems/${reportId}/comments`, {
          data: { body: "Local rainwater harvesting could help this community." },
        })
      ).status(),
    ).toBe(201);
    expect((await researcher.post(`/api/platform/problems/${reportId}/vote`)).status()).toBe(200);
    const voted = await (await researcher.get(`/api/platform/problems/${reportId}`)).json();
    expect(voted.voted).toBe(true);
    expect(voted._count.votes).toBe(1);
  });
  test("submits a researcher proposal and enforces its ordered review and unique rewards", async () => {
    const input = {
      title: `${prefix} rainwater pilot solution`,
      problemId: reportId,
      approach:
        "Build low-cost rainwater collection systems with community volunteers and monitor groundwater using solar-powered sensors. Validate with a three-month pilot and maintain a transparent public progress log.",
      techStack: "IoT, TypeScript, MongoDB",
      impact: "Reliable water access for two hundred village residents.",
      feasibility: "Use readily available components and train local maintenance volunteers.",
      resources: "Two mentors, sensor equipment, and a community testing site.",
    };
    expect((await citizen.post("/api/platform/proposals", { data: input })).status()).toBe(403);
    const submitted = await researcher.post("/api/platform/proposals", { data: input });
    expect(submitted.status(), await submitted.text()).toBe(201);
    proposalId = (await submitted.json()).id;
    expect((await outsider.get(`/api/platform/proposals/${proposalId}`)).status()).toBe(404);
    const detail = await (await outsider.get(`/api/platform/problems/${reportId}`)).json();
    expect(detail.proposals.some((s: any) => s.id === proposalId)).toBe(false);
    expect(
      (
        await admin.patch(`/api/platform/proposals/${proposalId}/status`, {
          data: { status: "APPROVED" },
        })
      ).status(),
    ).toBe(400);
    for (const status of ["UNDER_REVIEW", "SHORTLISTED", "APPROVED"]) {
      const res = await admin.patch(`/api/platform/proposals/${proposalId}/status`, {
        data: { status, note: "Reviewed for integration test" },
      });
      expect(res.status(), await res.text()).toBe(200);
    }
    const approved = await (await researcher.get(`/api/platform/proposals/${proposalId}`)).json();
    workspaceId = approved.collaboration.id;
    expect(workspaceId).toBeTruthy();
    expect(
      (
        await admin.patch(`/api/platform/proposals/${proposalId}/status`, {
          data: { status: "APPROVED" },
        })
      ).status(),
    ).toBe(400);
    expect(
      await db.achievement.count({
        where: { userId: researcherId, key: `approved:${proposalId}` },
      }),
    ).toBe(1);
  });
});
test.describe.serial("Phase 2 and 3 · collaboration, privacy and intelligence", () => {
  test("keeps collaboration private until support is accepted, then persists workspace activity", async () => {
    expect(workspaceId).toBeTruthy();
    expect((await citizen.get(`/api/platform/collaborations/${workspaceId}`)).status()).toBe(403);
    expect((await industry.get(`/api/platform/collaborations/${workspaceId}`)).status()).toBe(403);
    const support = await industry.post(`/api/platform/collaborations/${workspaceId}/support`, {
      data: {
        type: "MENTORSHIP",
        description: "We can provide weekly technical mentoring and field testing guidance.",
      },
    });
    expect(support.status(), await support.text()).toBe(201);
    const commitmentId = (await support.json()).id;
    expect((await industry.get(`/api/platform/collaborations/${workspaceId}`)).status()).toBe(403);
    expect(
      (
        await researcher.patch(`/api/platform/collaborations/${workspaceId}/support`, {
          data: { commitmentId, status: "ACCEPTED" },
        })
      ).status(),
    ).toBe(200);
    expect((await industry.get(`/api/platform/collaborations/${workspaceId}`)).status()).toBe(200);
    const milestone = await researcher.post(
      `/api/platform/collaborations/${workspaceId}/milestones`,
      { data: { title: "Validate rainwater harvesting pilot", dueDate: "2027-01-15" } },
    );
    expect(milestone.status()).toBe(201);
    const milestoneId = (await milestone.json()).id;
    expect(
      (
        await industry.patch(`/api/platform/collaborations/${workspaceId}/milestones`, {
          data: { milestoneId, done: true },
        })
      ).status(),
    ).toBe(403);
    expect(
      (
        await researcher.patch(`/api/platform/collaborations/${workspaceId}/milestones`, {
          data: { milestoneId, done: true },
        })
      ).status(),
    ).toBe(200);
    expect(
      (
        await researcher.patch(`/api/platform/collaborations/${workspaceId}/milestones`, {
          data: { milestoneId, done: true, verify: true },
        })
      ).status(),
    ).toBe(403);
    expect(await db.achievement.count({ where: { key: `milestone:${milestoneId}` } })).toBe(0);
    expect(
      (
        await admin.patch(`/api/platform/collaborations/${workspaceId}/milestones`, {
          data: { milestoneId, done: true, verify: true },
        })
      ).status(),
    ).toBe(200);
    expect(
      (
        await admin.patch(`/api/platform/collaborations/${workspaceId}/milestones`, {
          data: { milestoneId, done: true, verify: true },
        })
      ).status(),
    ).toBe(400);
    expect(
      (
        await researcher.patch(`/api/platform/collaborations/${workspaceId}/milestones`, {
          data: { milestoneId, done: false },
        })
      ).status(),
    ).toBe(400);
    expect(await db.achievement.count({ where: { key: `milestone:${milestoneId}` } })).toBe(1);
    const task = await researcher.post(`/api/platform/collaborations/${workspaceId}/tasks`, {
      data: { title: "Interview community participants" },
    });
    expect(task.status()).toBe(201);
    const taskId = (await task.json()).id;
    expect(
      (
        await researcher.patch(`/api/platform/collaborations/${workspaceId}/tasks`, {
          data: { taskId, done: true },
        })
      ).status(),
    ).toBe(200);
    expect(
      (
        await industry.patch(`/api/platform/collaborations/${workspaceId}/tasks`, {
          data: { taskId, done: false },
        })
      ).status(),
    ).toBe(403);
    expect(
      (
        await industry.post(`/api/platform/collaborations/${workspaceId}/discussion`, {
          data: { body: "Mentorship kickoff is confirmed for the pilot team." },
        })
      ).status(),
    ).toBe(201);
  });
  test("creates teams, sends invitations and requires explicit acceptance", async () => {
    const res = await researcher.post("/api/platform/teams", {
      data: {
        name: `${prefix} innovators`,
        description: "A test team working together on community water resilience.",
      },
    });
    expect(res.status()).toBe(201);
    teamId = (await res.json()).id;
    expect(
      (
        await citizen.post(`/api/platform/teams/${teamId}/invite`, {
          data: { email: `${prefix}-industry@example.test` },
        })
      ).status(),
    ).toBe(403);
    expect(
      (
        await researcher.post(`/api/platform/teams/${teamId}/invite`, {
          data: { email: `${prefix}-citizen@example.test` },
        })
      ).status(),
    ).toBe(201);
    const before = await db.teamMembership.findUnique({
      where: { teamId_userId: { teamId, userId: citizenId } },
    });
    expect(before?.accepted).toBe(false);
    expect((await citizen.post(`/api/platform/teams/${teamId}/accept`)).status()).toBe(200);
    expect((await citizen.patch(`/api/platform/teams/${teamId}/verify`)).status()).toBe(403);
    expect((await admin.patch(`/api/platform/teams/${teamId}/verify`)).status()).toBe(200);
  });
  test("returns editable assistance and matching, and completes the audited lifecycle", async () => {
    const assist = await researcher.post("/api/platform/assist", {
      data: {
        text: "Severe drinking water shortage in the village needs a rainwater monitoring solution.",
        latitude: 18.52,
        longitude: 73.85,
      },
    });
    expect(assist.status()).toBe(200);
    const data = await assist.json();
    expect(data.suggestion.category).toBe("Water Conservation");
    expect(data.suggestion.source).toBeTruthy();
    expect(data.duplicates.some((p: any) => p.id === reportId)).toBe(true);
    expect(
      (
        await researcher.patch("/api/platform/profile", {
          data: {
            name: "Integration Researcher",
            bio: "Researching water resilience.",
            skills: ["water", "sensors"],
            interests: ["Water Conservation"],
          },
        })
      ).status(),
    ).toBe(200);
    const dashboard = await (await researcher.get("/api/dashboard")).json();
    expect(dashboard.recommended.some((p: any) => p.match > 0)).toBe(true);
    for (const status of ["COLLABORATION", "PILOT", "RESOLVED"])
      expect(
        (
          await admin.patch(`/api/platform/problems/${reportId}/status`, { data: { status } })
        ).status(),
      ).toBe(200);
    for (const status of ["PILOT", "COMPLETED"])
      expect(
        (
          await admin.patch(`/api/platform/proposals/${proposalId}/status`, { data: { status } })
        ).status(),
      ).toBe(200);
    const timeline = await db.auditLog.findMany({
      where: { entityType: "Problem", entityId: reportId },
      orderBy: { createdAt: "asc" },
    });
    expect(timeline.map((a) => a.toStatus)).toEqual([
      "REPORTED",
      "UNDER_REVIEW",
      "OPEN",
      "COLLABORATION",
      "PILOT",
      "RESOLVED",
    ]);
    const notifications = await (await citizen.get("/api/platform/notifications")).json();
    expect(notifications.length).toBeGreaterThan(2);
    expect((await citizen.patch("/api/platform/notifications")).status()).toBe(200);
    expect(
      await db.achievement.count({ where: { userId: citizenId, key: `resolved:${reportId}` } }),
    ).toBe(1);
    const leaderboard = await (await outsider.get("/api/platform/leaderboard")).json();
    expect(leaderboard.some((u: any) => u.id === researcherId)).toBe(true);
  });
  test("keeps outcome evidence private until a separate administrator verifies it", async () => {
    const input = {
      collaborationId: workspaceId,
      metric: "WATER_USAGE_LITRES",
      baseline: 1000,
      observed: 700,
      sampleSize: 20,
      periodStart: "2026-01-01",
      periodEnd: "2026-01-31",
      methodology:
        "Compared the same twenty household meter readings over matched thirty-day periods with a documented baseline.",
      evidenceUrl: "https://example.org/field-report",
    };
    expect((await citizen.post("/api/evidence", { data: input })).status()).toBe(403);
    const created = await researcher.post("/api/evidence", { data: input });
    expect(created.status(), await created.text()).toBe(201);
    const measurementId = (await created.json()).id;
    expect((await outsider.get(`/api/evidence?collaborationId=${workspaceId}`)).status()).toBe(401);
    expect((await outsider.get("/api/evidence?scope=review")).status()).toBe(401);
    expect(
      (await (await outsider.get("/api/evidence")).json()).some((m: any) => m.id === measurementId),
    ).toBe(false);
    expect(
      (
        await researcher.patch("/api/evidence", {
          data: {
            id: measurementId,
            status: "VERIFIED",
            reviewNote: "Reviewed the supplied metering methodology.",
          },
        })
      ).status(),
    ).toBe(403);
    expect(
      (
        await admin.patch("/api/evidence", {
          data: {
            id: measurementId,
            status: "VERIFIED",
            reviewNote: "Reviewed comparable meter periods and the field evidence.",
          },
        })
      ).status(),
    ).toBe(200);
    const publicItems = await (await outsider.get("/api/evidence")).json();
    const row = publicItems.find((m: any) => m.id === measurementId);
    expect(row.status).toBe("VERIFIED");
    expect(row.author).not.toHaveProperty("email");
    expect(
      (
        await admin.patch("/api/evidence", {
          data: {
            id: measurementId,
            status: "VERIFIED",
            reviewNote: "Repeated verification should be rejected.",
          },
        })
      ).status(),
    ).toBe(409);
    expect(
      await db.auditLog.count({
        where: { entityType: "ImpactMeasurement", entityId: measurementId },
      }),
    ).toBe(2);
  });
  test("protects operations, exports safely, exposes local AI provenance and health", async () => {
    expect((await outsider.get("/api/operations")).status()).toBe(401);
    expect((await citizen.get("/api/operations")).status()).toBe(403);
    const queue = await admin.get("/api/operations");
    expect(queue.status()).toBe(200);
    const result = await queue.json();
    expect(result.items.every((p: any) => p.priority.score >= 0 && p.priority.score <= 100)).toBe(
      true,
    );
    const csv = await admin.get("/api/operations?format=csv");
    expect(csv.headers()["content-type"]).toContain("text/csv");
    expect(await csv.text()).toContain("Priority");
    const emptyCsv = await admin.get("/api/operations?format=csv&q=no-such-civic-report-xyzzy");
    expect((await emptyCsv.text()).split("\r\n")).toHaveLength(1);
    expect((await outsider.get("/api/system")).status()).toBe(401);
    expect((await citizen.get("/api/system")).status()).toBe(403);
    const systemResponse = await admin.get("/api/system");
    expect(
      systemResponse
        .headers()
        ["cache-control"].split(",")
        .map((value) => value.trim()),
    ).toContain("no-store");
    const system = await systemResponse.json();
    expect(system.database.status).toBe("ready");
    expect(system.pipeline.trainingSamples).toBe(391);
    expect(system.pipeline.artifactHash).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(system)).not.toContain(process.env.AUTH_SECRET);
    expect(JSON.stringify(system)).not.toContain(process.env.DATABASE_URL);
    const card = await (await outsider.get("/api/intelligence")).json();
    expect(card.provenance).toBe("public-municipal-data");
    expect(card.metrics.testSamples).toBe(112);
    expect(
      (
        await outsider.post("/api/intelligence", {
          data: { text: "A drinking water shortage affects our village every summer." },
        })
      ).status(),
    ).toBe(401);
    const inference = await researcher.post("/api/intelligence", {
      data: {
        text: "Our village borewell is dry and drinking water tankers are unreliable.",
        dataset: "demo",
      },
    });
    expect(inference.status()).toBe(200);
    expect((await inference.json()).model.category).toBe("Water Conservation");
    expect((await outsider.get("/api/health")).status()).toBe(200);
    expect((await outsider.get("/api/health/ready")).status()).toBe(200);
  });
});
test.afterAll(async () => {
  // Remove only records belonging to accounts created by this exact test run.
  const users = await db.user.findMany({
    where: { email: { startsWith: prefix } },
    select: { id: true, organizationId: true },
  });
  const userIds = users.map((u) => u.id);
  const orgIds = users.flatMap((u) => (u.organizationId ? [u.organizationId] : []));
  if (userIds.length) {
    await db.$transaction(async (tx) => {
      const reports = await tx.problem.findMany({
        where: { authorId: { in: userIds } },
        select: { id: true },
      });
      const pids = reports.map((p) => p.id);
      const proposals = await tx.solutionProposal.findMany({
        where: { OR: [{ authorId: { in: userIds } }, { problemId: { in: pids } }] },
        select: { id: true },
      });
      const sids = proposals.map((s) => s.id);
      const collabs = await tx.collaboration.findMany({
        where: { proposalId: { in: sids } },
        select: { id: true },
      });
      const cids = collabs.map((c) => c.id);
      const measurements = await tx.impactMeasurement.findMany({
        where: { collaborationId: { in: cids } },
        select: { id: true },
      });
      await tx.auditLog.deleteMany({
        where: { entityType: "ImpactMeasurement", entityId: { in: measurements.map((m) => m.id) } },
      });
      await tx.supportCommitment.deleteMany({
        where: { OR: [{ userId: { in: userIds } }, { collaborationId: { in: cids } }] },
      });
      await tx.collaboration.deleteMany({ where: { id: { in: cids } } });
      await tx.problemImage.deleteMany({ where: { ownerId: { in: userIds } } });
      await tx.solutionProposal.deleteMany({ where: { id: { in: sids } } });
      await tx.comment.deleteMany({ where: { authorId: { in: userIds } } });
      await tx.vote.deleteMany({ where: { userId: { in: userIds } } });
      await tx.problem.deleteMany({ where: { id: { in: pids } } });
      await tx.teamMembership.deleteMany({ where: { userId: { in: userIds } } });
      await tx.team.deleteMany({ where: { name: { startsWith: prefix } } });
      await tx.notification.deleteMany({ where: { userId: { in: userIds } } });
      await tx.achievement.deleteMany({ where: { userId: { in: userIds } } });
      await tx.auditLog.deleteMany({
        where: {
          OR: [
            { actorId: { in: userIds } },
            { entityId: { in: [...pids, ...sids, ...cids, teamId] } },
          ],
        },
      });
      await tx.user.deleteMany({ where: { id: { in: userIds } } });
      await tx.organization.deleteMany({ where: { id: { in: orgIds } } });
    });
  }
  for (const c of [citizen, researcher, industry, admin, outsider]) if (c) await c.dispose();
  await db.$disconnect();
});
