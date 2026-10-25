import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { productionIssues, demoAccountsAllowed } from "@/lib/production";
import { json, failure } from "@/lib/http";
import pipeline from "@/lib/ai/generated/pipeline-report.json";

export const dynamic = "force-dynamic";
export async function GET() {
  try {
    await requireUser(["ADMIN"]);
    const started = Date.now();
    // Read-only transaction checks the replica-set behavior used by application mutations.
    const [pendingEvidence, unverifiedOrganizations] = await db.$transaction([
      db.impactMeasurement.count({ where: { status: "PENDING" } }),
      db.organization.count({ where: { verified: false } }),
    ]);
    return json({
      checkedAt: new Date().toISOString(),
      environment: process.env.NODE_ENV === "production" ? "production" : "development",
      database: { status: "ready", transactionCheckMs: Date.now() - started },
      configurationIssues: productionIssues(process.env),
      demoSignInEnabled: demoAccountsAllowed(),
      assistance: process.env.LLM_API_KEY
        ? "remote-with-local-fallback"
        : process.env.AI_CLASSIFIER_MODE === "local-model"
          ? "local-model-with-rules-fallback"
          : "rules",
      pendingEvidence,
      unverifiedOrganizations,
      pipeline,
    });
  } catch (error) {
    return failure(error);
  }
}
