import { auth } from "@/auth";
import { db } from "./db";
import { AppError } from "./security";
import type { Role } from "@prisma/client";
import { publicStatuses } from "./domain";
import { demoAccountsAllowed } from "./production";
export async function currentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return db.user.findFirst({
    where: {
      id: session.user.id,
      active: true,
      ...(!demoAccountsAllowed() ? { isDemo: false } : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      organizationId: true,
      isDemo: true,
      bio: true,
      skills: true,
      interests: true,
      organization: { select: { id: true, name: true, verified: true } },
    },
  });
}
export async function requireUser(roles?: Role[]) {
  const user = await currentUser();
  if (!user) throw new AppError(401, "Sign in to continue.");
  if (roles && !roles.includes(user.role))
    throw new AppError(403, "Your role cannot perform this action.");
  return user;
}
export function canSeeProblem(
  p: { authorId: string; status: string },
  u: { id: string; role: string } | null,
) {
  return (
    publicStatuses.includes(p.status as (typeof publicStatuses)[number]) ||
    u?.id === p.authorId ||
    u?.role === "ADMIN"
  );
}
export async function workspaceAccess(id: string, user: { id: string; role: string }) {
  const c = await db.collaboration.findUnique({
    where: { id },
    include: { proposal: { include: { team: { include: { members: true } } } }, commitments: true },
  });
  if (!c) throw new AppError(404, "Workspace not found.");
  const member =
    user.role === "ADMIN" ||
    c.proposal.authorId === user.id ||
    c.proposal.team?.members.some((m) => m.userId === user.id && m.accepted) ||
    c.commitments.some((s) => s.userId === user.id && s.status === "ACCEPTED");
  if (!member)
    throw new AppError(
      403,
      "This workspace is private. An accepted collaboration or team invitation is required.",
    );
  return c;
}
