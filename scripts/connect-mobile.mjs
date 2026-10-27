import { networkInterfaces } from "node:os";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
export const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export function localConnection(host, lan = false) {
  const candidates = Object.entries(networkInterfaces())
    .filter(([name]) => !/virtual|vethernet|docker|wsl|tailscale|vpn|zerotier/i.test(name))
    .flatMap(([, addresses]) => addresses ?? [])
    .filter((item) => item.family === "IPv4" && !item.internal)
    .map((item) => item.address);
  const selected = !lan
    ? "127.0.0.1"
    : (host ??
      candidates.find((value) => /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(value)));
  if (!selected || (lan && !candidates.includes(selected)))
    throw new Error(
      "Choose a private IPv4 address assigned to this computer: node scripts/connect-mobile.mjs --host <address>",
    );
  const origin = new URL(`http://${selected}:3000`);
  if (!/^(127\.0\.0\.1$|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(origin.hostname))
    throw new Error("Local preview requires a private LAN address.");
  const config = { apiUrl: origin.origin, localPreview: true, transport: lan ? "lan" : "usb" };
  mkdirSync(resolve(projectRoot, ".data"), { recursive: true });
  writeFileSync(
    resolve(projectRoot, ".data/mobile-connection.json"),
    JSON.stringify(config, null, 2) + "\n",
  );
  writeFileSync(
    resolve(projectRoot, "mobile/.env.local"),
    `# Local phone/website preview. No database credentials belong in this file.\nEXPO_PUBLIC_API_URL=${config.apiUrl}\nEXPO_PUBLIC_LOCAL_PREVIEW=true\n`,
  );
  return config;
}
export function readConnection() {
  const value = JSON.parse(
    readFileSync(resolve(projectRoot, ".data/mobile-connection.json"), "utf8"),
  );
  const url = new URL(value.apiUrl);
  if (
    url.protocol !== "http:" ||
    url.port !== "3000" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    !/^(127\.0\.0\.1$|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(url.hostname)
  )
    throw new Error("Run npm run mobile:connect to refresh the local connection.");
  return value;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const hostIndex = process.argv.indexOf("--host");
  const config = localConnection(
    hostIndex < 0 ? undefined : process.argv[hostIndex + 1],
    process.argv.includes("--lan"),
  );
  console.log(`Website and native preview API: ${config.apiUrl}`);
  console.log(
    config.transport === "usb"
      ? "Use adb reverse tcp:3000 tcp:3000 with USB debugging. The shared backend stays on localhost."
      : "LAN mode requires explicit approval before starting a network-visible backend.",
  );
}
