import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { platformStats } from "@/lib/queries";
import { matchScore, publicStatuses } from "@/lib/domain";
import { AppError } from "@/lib/security";
export async function GET() {
  try {
    const u = await requireUser();
    const [stats, problems, proposals, notifications, teams, support, achievements, recommended] =
      await Promise.all([
        platformStats(),
        db.problem.findMany({
          where: { authorId: u.id },
          include: { _count: { select: { proposals: true, comments: true, votes: true } } },
          orderBy: { createdAt: "desc" },
        }),
        db.solutionProposal.findMany({
          where:
            u.role === "INSTITUTION" && u.organizationId
              ? { OR: [{ authorId: u.id }, { team: { organizationId: u.organizationId } }] }
              : { authorId: u.id },
          include: {
            problem: { select: { id: true, title: true, category: true, city: true } },
            collaboration: { select: { id: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
        db.notification.findMany({
          where: { userId: u.id },
          orderBy: { createdAt: "desc" },
          take: 8,
        }),
        db.team.count({
          where: {
            OR: [
              { members: { some: { userId: u.id, accepted: true } } },
              ...(u.role === "INSTITUTION" && u.organizationId
                ? [{ organizationId: u.organizationId }]
                : []),
            ],
          },
        }),
        db.supportCommitment.findMany({
          where: { userId: u.id },
          include: { collaboration: { include: { proposal: { select: { title: true } } } } },
        }),
        db.achievement.findMany({ where: { userId: u.id } }),
        db.problem.findMany({
          where: {
            status: { in: [...publicStatuses] },
            ...(u.role === "RESEARCHER" ? { status: "OPEN" } : {}),
          },
          include: {
            author: { select: { id: true, name: true } },
            images: { select: { id: true, name: true, mime: true } },
            _count: { select: { proposals: true, comments: true, votes: true } },
          },
          take: 100,
          orderBy: { createdAt: "desc" },
        }),
      ]);
    return NextResponse.json({
      user: u,
      stats,
      problems,
      proposals,
      notifications,
      teams,
      support,
      achievements,
      recommended: recommended
        .map((p) => ({ ...p, match: matchScore(u.skills, u.interests, p) }))
        .sort((a, b) => b.match - a.match)
        .slice(0, 6),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof AppError ? e.message : "Dashboard could not be loaded." },
      { status: e instanceof AppError ? e.status : 500 },
    );
  }
}
