import { db } from "./db";
import { demoAccountsAllowed } from "./production";
import { mobileToken, tokenDigest } from "./mobile-tokens";
export async function mobileSessionUserId(authorization: string | null) {
  const token = mobileToken(authorization);
  if (!token) return null;
  const session = await db.mobileSession.findUnique({
    where: { tokenHash: tokenDigest(token) },
    select: { expiresAt: true, user: { select: { id: true, active: true, isDemo: true } } },
  });
  if (
    !session ||
    session.expiresAt <= new Date() ||
    !session.user.active ||
    (session.user.isDemo && !demoAccountsAllowed())
  )
    return null;
  return session.user.id;
}
