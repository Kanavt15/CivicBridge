"use server";
import { requireUser } from "@/lib/session";
import { rateLimit } from "@/lib/security";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
export async function markAllNotificationsRead() {
  const user = await requireUser();
  await rateLimit(user.id, "notifications", 30);
  await db.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true },
  });
  revalidatePath("/notifications");
  return { ok: true };
}
