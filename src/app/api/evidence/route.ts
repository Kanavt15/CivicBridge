import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser, workspaceAccess } from "@/lib/session";
import { AppError, checkOrigin, rateLimit } from "@/lib/security";
import { json, failure, parseJson } from "@/lib/http";
import { measurementSchema } from "@/lib/impact-evidence";
import { publicStatuses } from "@/lib/domain";
const include = {
  author: { select: { id: true, name: true } },
  collaboration: {
    select: {
      id: true,
      proposal: {
        select: {
          id: true,
          title: true,
          isDemo: true,
          problem: { select: { id: true, city: true, state: true, category: true, status: true } },
        },
      },
    },
  },
};
export async function GET(req: NextRequest) {
  try {
    const scope = req.nextUrl.searchParams.get("scope");
    const collaborationId = req.nextUrl.searchParams.get("collaborationId");
    if (scope === "review") await requireUser(["ADMIN"]);
    else if (collaborationId) await workspaceAccess(collaborationId, await requireUser());
    const where =
      scope === "review"
        ? {}
        : collaborationId
          ? { collaborationId }
          : {
              status: "VERIFIED",
              collaboration: { proposal: { problem: { status: { in: [...publicStatuses] } } } },
            };
    return json(
      await db.impactMeasurement.findMany({
        where,
        include,
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
    );
  } catch (error) {
    return failure(error);
  }
}
export async function POST(req: Request) {
  try {
    await checkOrigin(req);
    const user = await requireUser();
    await rateLimit(user.id, "evidence", 10, 3600000);
    const input = await parseJson(req, measurementSchema);
    const c = await workspaceAccess(input.collaborationId, user);
    if (
      user.role !== "ADMIN" &&
      c.proposal.authorId !== user.id &&
      !c.proposal.team?.members.some((m) => m.userId === user.id && m.accepted)
    )
      throw new AppError(403, "Only innovation team members can submit impact measurements.");
    const result = await db.$transaction(async (tx) => {
      const row = await tx.impactMeasurement.create({
        data: { ...input, authorId: user.id, reviewedAt: null },
      });
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          entityType: "ImpactMeasurement",
          entityId: row.id,
          action: "SUBMITTED",
        },
      });
      return row;
    });
    return json(result, 201);
  } catch (error) {
    return failure(error);
  }
}
export async function PATCH(req: Request) {
  try {
    await checkOrigin(req);
    const user = await requireUser(["ADMIN"]);
    await rateLimit(user.id, "evidence-review", 30);
    const input = await parseJson(
      req,
      z.object({
        id: z.string(),
        status: z.enum(["VERIFIED", "REJECTED"]),
        reviewNote: z.string().trim().min(10).max(2000),
      }),
    );
    await db.$transaction(async (tx) => {
      const row = await tx.impactMeasurement.findUnique({ where: { id: input.id } });
      if (!row) throw new AppError(404, "Measurement not found.");
      if (row.authorId === user.id)
        throw new AppError(403, "A different administrator must review your own measurement.");
      const changed = await tx.impactMeasurement.updateMany({
        where: { id: input.id, status: "PENDING" },
        data: { status: input.status, reviewNote: input.reviewNote, reviewedAt: new Date() },
      });
      if (!changed.count) throw new AppError(409, "This measurement was already reviewed.");
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          entityType: "ImpactMeasurement",
          entityId: row.id,
          action: input.status,
          fromStatus: "PENDING",
          toStatus: input.status,
          note: input.reviewNote,
        },
      });
      await tx.notification.create({
        data: {
          userId: row.authorId,
          title: "Impact evidence reviewed",
          body: `Your measurement was ${input.status.toLowerCase()}. ${input.reviewNote}`,
          href: `/collaborations/${row.collaborationId}`,
        },
      });
    });
    return json({ ok: true });
  } catch (error) {
    return failure(error);
  }
}
