import { db } from "@/lib/db";
import { json } from "@/lib/http";
export const dynamic = "force-dynamic";
let pending: Promise<boolean> | null = null;
let cached: { ok: boolean; at: number } | null = null;
export async function GET() {
  if (cached && Date.now() - cached.at < 5000)
    return json({ status: cached.ok ? "ready" : "unavailable" }, cached.ok ? 200 : 503);
  pending ??= db
    .$runCommandRaw({ ping: 1 })
    .then(() => true)
    .catch(() => false)
    .then((ok) => {
      cached = { ok, at: Date.now() };
      return ok;
    })
    .finally(() => {
      pending = null;
    });
  let timer: ReturnType<typeof setTimeout> | undefined;
  const ok = await Promise.race([
    pending,
    new Promise<boolean>((resolve) => {
      timer = setTimeout(() => resolve(false), 3000);
    }),
  ]);
  if (timer) clearTimeout(timer);
  return json({ status: ok ? "ready" : "unavailable" }, ok ? 200 : 503);
}
