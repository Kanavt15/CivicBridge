import { readFileSync, writeFileSync } from "node:fs";
import { inspectPipeline } from "../src/lib/ai/pipeline";

try {
  const report = inspectPipeline(
    readFileSync("data/sources/nyc311-2025-descriptors.json", "utf8"),
    readFileSync("data/nyc311-civic.json", "utf8"),
    readFileSync("src/lib/ai/generated/model.json", "utf8"),
  );
  const serialized = JSON.stringify(report, null, 2) + "\n";
  const path = "src/lib/ai/generated/pipeline-report.json";
  if (process.argv.includes("--write")) writeFileSync(path, serialized);
  else if (readFileSync(path, "utf8") !== serialized)
    throw new Error("Bundled pipeline report is stale. Run npm run etl.");
  console.log(
    `ETL verified: ${report.sourceRows} source pairs, ${report.trainingSamples} train / ${report.testSamples} held-out descriptors. Fingerprints, deterministic model, metrics, and quality gates passed.`,
  );
} catch (error) {
  console.error(`ETL validation failed: ${(error as Error).message}`);
  process.exitCode = 1;
}
