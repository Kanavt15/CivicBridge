// A code-drawn bridge mark, matching the existing brand; no external assets.
import { deflateSync } from "node:zlib";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
const table = Array.from({ length: 256 }, (_, i) => {
  let c = i;
  for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function chunk(type, data) {
  const bytes = Buffer.concat([Buffer.from(type), data]);
  let crc = 0xffffffff;
  for (const b of bytes) crc = table[(crc ^ b) & 255] ^ (crc >>> 8);
  const head = Buffer.alloc(4),
    tail = Buffer.alloc(4);
  head.writeUInt32BE(data.length);
  tail.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
  return Buffer.concat([head, bytes, tail]);
}
function image(size, transparent = false) {
  const width = size * 2,
    rgba = Buffer.alloc(width * width * 4);
  for (let i = 0; i < rgba.length; i += 4) {
    rgba[i] = 23;
    rgba[i + 1] = 23;
    rgba[i + 2] = 23;
    rgba[i + 3] = transparent ? 0 : 255;
  }
  const point = (x, y, r, color) => {
    x = (x * width) / 512;
    y = (y * width) / 512;
    r = (r * width) / 512;
    for (let py = Math.max(0, Math.floor(y - r)); py < Math.min(width, Math.ceil(y + r)); py++)
      for (let px = Math.max(0, Math.floor(x - r)); px < Math.min(width, Math.ceil(x + r)); px++) {
        if ((px - x) ** 2 + (py - y) ** 2 > r * r) continue;
        const index = (py * width + px) * 4;
        for (let k = 0; k < 3; k++) rgba[index + k] = color[k];
        rgba[index + 3] = 255;
      }
  };
  const stroke = (ax, ay, bx, by, color = [255, 255, 255], radius = 9) => {
    const steps = Math.ceil((Math.hypot(bx - ax, by - ay) * width) / 256);
    for (let i = 0; i <= steps; i++)
      point(ax + ((bx - ax) * i) / steps, ay + ((by - ay) * i) / steps, radius, color);
  };
  stroke(112, 360, 112, 196);
  stroke(400, 360, 400, 196);
  stroke(256, 152, 256, 360);
  let last = [112, 270];
  for (let i = 1; i <= 120; i++) {
    const t = i / 120;
    const now = [112 + 288 * t, 270 - 118 * Math.sin(Math.PI * t)];
    stroke(...last, ...now);
    last = now;
  }
  stroke(86, 368, 426, 368);
  stroke(160, 404, 352, 404, [200, 200, 200], 5);
  // Supersample at 2x so the small installed icon keeps clean edges.
  const rows = Buffer.alloc(size * (1 + size * 4));
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++)
      for (let c = 0; c < 4; c++) {
        let v = 0;
        for (let dy = 0; dy < 2; dy++)
          for (let dx = 0; dx < 2; dx++) v += rgba[((y * 2 + dy) * width + x * 2 + dx) * 4 + c];
        rows[y * (1 + size * 4) + 1 + x * 4 + c] = Math.round(v / 4);
      }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(rows)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
mkdirSync("public/icons", { recursive: true });
for (const size of [180, 192, 512]) writeFileSync(`public/icons/app-${size}.png`, image(size));
if (existsSync("mobile/assets")) {
  writeFileSync("mobile/assets/icon.png", image(1024));
  writeFileSync("mobile/assets/monochrome.png", image(432, true));
}
console.log("Generated 180px Apple and 192/512px install icons.");
