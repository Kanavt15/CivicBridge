import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { request } from "@playwright/test";
try {
  process.loadEnvFile(".env");
} catch {}
const database = new URL(process.env.DATABASE_URL ?? "");
if (
  !["127.0.0.1", "localhost"].includes(database.hostname) ||
  !/^civicbridge_(?:test|ci|upgrade_test)(?:_[a-z0-9]+)?$/.test(database.pathname.slice(1))
)
  throw new Error("Disposable local database required.");
const evidence = JSON.parse(readFileSync(".data/android-smoke.json", "utf8"));
if (
  evidence.database !== database.pathname.slice(1) ||
  !/^android-native-\d+ unsafe footpath near the school$/.test(evidence.title)
)
  throw new Error("Unexpected native smoke record.");
async function main() {
  const db = new PrismaClient();
  const baseURL = process.env.TEST_BASE_URL ?? "http://127.0.0.1:3101";
  const client = await request.newContext({ baseURL, extraHTTPHeaders: { Origin: baseURL } });
  try {
    const health = await (await client.get("/api/health")).json();
    if (health.testDatabase !== evidence.database)
      throw new Error("Server/database identity mismatch.");
    const report = await db.problem.findFirstOrThrow({
      where: { title: evidence.title, author: { email: "citizen@demo.civicbridge.in" } },
    });
    if (
      report.status !== "REPORTED" ||
      report.description !==
        "Broken pavement beside the school makes daily travel unsafe for children and older residents." ||
      report.category !== "Infrastructure" ||
      report.latitude !== 18.52 ||
      report.longitude !== 73.85 ||
      report.city !== "Pune"
    )
      throw new Error("Native values did not persist correctly.");
    const { csrfToken } = await (await client.get("/api/auth/csrf")).json();
    await client.post("/api/auth/callback/credentials", {
      form: {
        csrfToken,
        email: "citizen@demo.civicbridge.in",
        password: process.env.DEMO_PASSWORD || "CivicBridge@2026",
        callbackUrl: baseURL,
      },
      headers: { "X-Auth-Return-Redirect": "1" },
    });
    const web = await (await client.get(`/api/platform/problems/${report.id}`)).json();
    if (web.id !== report.id || web.title !== report.title)
      throw new Error("Website did not read the same native record.");
    console.log(
      "Installed Android app and website read the same persisted report, author, status and coordinates.",
    );
    await db.$transaction(async (tx) => {
      await tx.auditLog.deleteMany({ where: { entityId: report.id } });
      await tx.notification.deleteMany({ where: { href: `/problems/${report.id}` } });
      await tx.problem.delete({ where: { id: report.id } });
    });
    console.log("Removed the exact synthetic native report and its audit/notification records.");
  } finally {
    await client.dispose();
    await db.$disconnect();
  }
}
main().catch(() => {
  console.error(
    "Native verification failed. Check the disposable backend and saved smoke evidence.",
  );
  process.exitCode = 1;
});
