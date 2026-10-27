import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { projectRoot, readConnection } from "./connect-mobile.mjs";
const { apiUrl, transport } = readConnection();
const lan = transport === "lan";
if (lan && !process.argv.includes("--lan"))
  throw new Error(
    "LAN exposure requires an explicit --lan launch. Use npm run mobile:connect for a localhost-only USB preview.",
  );
try {
  process.loadEnvFile(resolve(projectRoot, ".env"));
} catch {}
if (!process.env.DATABASE_URL)
  throw new Error("Configure the website's server .env with DATABASE_URL before starting.");
console.log(`Website: ${apiUrl} | phone API: ${apiUrl}`);
console.log(
  "Both clients use the existing server database. Keep this process running for the local preview.",
);
const child = spawn(
  process.execPath,
  [
    resolve(projectRoot, "node_modules/next/dist/bin/next"),
    "start",
    "--hostname",
    lan ? new URL(apiUrl).hostname : "127.0.0.1",
    "--port",
    "3000",
  ],
  {
    cwd: projectRoot,
    stdio: "inherit",
    env: {
      ...process.env,
      AUTH_URL: apiUrl,
      ALLOW_DEMO_ACCOUNTS: "false",
      AI_CLASSIFIER_MODE: process.env.AI_CLASSIFIER_MODE ?? "local-model",
    },
  },
);
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
child.on("error", () => {
  console.error("Could not start the shared backend.");
  process.exitCode = 1;
});
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
