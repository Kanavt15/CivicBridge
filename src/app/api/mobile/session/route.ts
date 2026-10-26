import { db } from "@/lib/db";
import { verifyCredentials } from "@/lib/credentials";
import { mobileError, mobileJson, nativeJson } from "@/lib/mobile-http";
import {
  newMobileToken,
  tokenDigest,
  mobileSessionDurationMs,
  mobileToken,
} from "@/lib/mobile-tokens";
import { AppError, rateLimit, checkOrigin } from "@/lib/security";
import { requireUser } from "@/lib/session";
export const runtime = "nodejs";
export async function POST(req: Request) {
  try {
    const input = await nativeJson(req);
    await rateLimit("global", "mobile-login", 1000, 15 * 60000);
    const user = await verifyCredentials(input);
    if (!user) throw new AppError(401, "Sign-in failed. Check your email and password.");
    const token = newMobileToken();
    const expiresAt = new Date(Date.now() + mobileSessionDurationMs);
    await db.mobileSession.create({
      data: { userId: user.id, tokenHash: tokenDigest(token), expiresAt },
    });
    return mobileJson({ token, expiresAt, user }, 201);
  } catch (e) {
    return mobileError(e);
  }
}
export async function GET(req: Request) {
  try {
    if (!mobileToken(req.headers.get("authorization")))
      throw new AppError(401, "Sign in to continue.");
    return mobileJson({ user: await requireUser() });
  } catch (e) {
    return mobileError(e);
  }
}
export async function DELETE(req: Request) {
  try {
    const token = mobileToken(req.headers.get("authorization"));
    if (!token) throw new AppError(401, "Sign in to continue.");
    // Revocation is idempotent, including already expired sessions.
    if (req.headers.get("origin")) await checkOrigin(req);
    await db.mobileSession.deleteMany({ where: { tokenHash: tokenDigest(token) } });
    return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return mobileError(e);
  }
}
