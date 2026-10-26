// Local UI review of an exported React Native Web bundle; no API proxy or data writes.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { dirname, extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../dist");
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".json": "application/json",
  ".css": "text/css",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
};
createServer(async (req, res) => {
  try {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405).end();
      return;
    }
    const file = resolve(
      root,
      "." + decodeURIComponent(new URL(req.url, "http://localhost").pathname),
    );
    if (file !== root && !file.startsWith(root + sep)) {
      res.writeHead(403).end();
      return;
    }
    const target = (await stat(file).catch(() => null))?.isFile()
      ? file
      : resolve(root, "index.html");
    const body = await readFile(target);
    res.writeHead(200, {
      "Content-Type": types[extname(target)] ?? "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(req.method === "HEAD" ? undefined : body);
  } catch {
    res.writeHead(404).end("Export the app first: npm run export:web");
  }
}).listen(8083, "127.0.0.1", () => console.log("Native UI preview: http://127.0.0.1:8083"));
