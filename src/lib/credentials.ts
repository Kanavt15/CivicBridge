import { compare } from "bcryptjs";
import { z } from "zod";
import { db } from "./db";
import { rateLimit } from "./security";
import { demoAccountsAllowed } from "./production";
// Shared by browser and native sign-in, including the same rate-limit bucket.
export async function verifyCredentials(credentials: unknown) {
  const parsed = z
    .object({ email: z.email().max(254), password: z.string().min(1).max(128) })
    .safeParse(credentials);
  if (!parsed.success) return null;
  const email = parsed.data.email.toLowerCase();
  await rateLimit(email, "login", 10, 15 * 60000);
  const user = await db.user.findUnique({ where: { email } });
  const valid = await compare(
    parsed.data.password,
    user?.passwordHash ?? "$2b$12$d7ztK6nrq.XZ53/1VdHIT.CvFplHgFBR8LD.yO0lUEy3/QfDHQWFS",
  );
  if (!user || !user.active || !valid || (user.isDemo && !demoAccountsAllowed())) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}
