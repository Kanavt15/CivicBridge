import { db } from "./db";
import { createHash } from "node:crypto";
import { mobileSessionUserId } from "./mobile-session";
export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function rateLimit(identity: string, scope: string, limit = 30, windowMs = 60000) {
  const now = Date.now(),
    bucket = Math.floor(now / windowMs);
  const key = createHash("sha256").update(`${scope}:${identity}:${bucket}`).digest("hex");
  const row = await db.rateLimit.upsert({
    where: { key },
    create: { key, count: 1, expiresAt: new Date((bucket + 1) * windowMs) },
    update: { count: { increment: 1 } },
  });
  if (row.count > limit) throw new AppError(429, "Too many requests. Please try again shortly.");
}
export async function checkOrigin(req: Request) {
  const origin = req.headers.get("origin");
  // Only a verified non-cookie credential can replace browser CSRF protection.
  if (!origin && (await mobileSessionUserId(req.headers.get("authorization")))) return;
  const canonical = new URL(process.env.AUTH_URL || req.url).origin;
  const allowed = new Set([canonical]);
  if (
    process.env.NODE_ENV !== "production" &&
    ["127.0.0.1", "localhost"].includes(new URL(canonical).hostname)
  ) {
    const local = new URL(canonical);
    local.hostname = "localhost";
    allowed.add(local.origin);
    local.hostname = "127.0.0.1";
    allowed.add(local.origin);
  }
  if (!origin || !allowed.has(origin)) throw new AppError(403, "Request origin is not allowed.");
}
