import { spawnSync } from "node:child_process";

if (!process.env.npm_execpath) throw new Error("Run with npm run etl.");
const flags = process.argv.slice(2);
if (flags.some((flag) => flag !== "--refresh")) throw new Error("Supported option: --refresh");
// Offline by default; upstream refresh is an explicit operator decision.
const commands = [
  ...(flags.includes("--refresh") ? [["run", "ai:fetch"]] : []),
  ["run", "ai:prepare"],
  ["run", "ai:train"],
  ["exec", "--", "tsx", "scripts/check-pipeline.ts", "--write"],
];
for (const args of commands) {
  const result = spawnSync(process.execPath, [process.env.npm_execpath, ...args], {
    stdio: "inherit",
    shell: false,
  });
  if (result.error || result.status !== 0) {
    console.error("ETL stopped; review the working-tree changes before committing or deploying.");
    process.exit(result.status ?? 1);
  }
}
console.log(
  "ETL complete. Review the source, dataset, model, and pipeline-report diff together before release.",
);
