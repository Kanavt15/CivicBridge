import { createHash, randomBytes } from "node:crypto";
export const mobileSessionDurationMs = 7 * 24 * 60 * 60 * 1000;
export function newMobileToken() {
  return "cbm_" + randomBytes(32).toString("base64url");
}
export function mobileToken(authorization: string | null) {
  const match = /^Bearer (cbm_[A-Za-z0-9_-]{43})$/.exec(authorization ?? "");
  return match && match[0] === authorization ? match[1] : null;
}
export function tokenDigest(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
