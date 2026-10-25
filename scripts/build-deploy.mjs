import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

// npm_execpath lets Node invoke npm directly, including on Windows where npm is a .cmd file.
// The outer command needs no shell-specific pipeline operators.
const npmCli = process.env.npm_execpath;
if (!npmCli || !existsSync(npmCli)) {
  console.error("Run this script with npm run build:deploy (npm.cmd on Windows PowerShell).");
  process.exit(1);
}

for (const args of [
  ["ci", "--include=dev", "--no-audit", "--no-fund"],
  ["run", "build"],
]) {
  const result = spawnSync(process.execPath, [npmCli, ...args], {
    stdio: "inherit",
    shell: false,
    env: process.env,
  });
  if (result.error) {
    console.error(`Could not start npm ${args[0]}: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`npm ${args.join(" ")} failed; deployment build stopped.`);
    process.exit(result.status ?? 1);
  }
}
