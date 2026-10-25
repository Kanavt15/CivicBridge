import { db } from "@/lib/db";
import { currentUser, canSeeProblem } from "@/lib/session";
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const file = await db.problemImage.findUnique({
    where: { id },
    include: {
      problem: { select: { authorId: true, status: true } },
      proposal: {
        select: {
          authorId: true,
          status: true,
          team: {
            select: { organizationId: true, members: { select: { userId: true, accepted: true } } },
          },
        },
      },
    },
  });
  if (!file) return new Response("Not found", { status: 404 });
  const u = await currentUser();
  const allowed =
    u?.id === file.ownerId ||
    u?.role === "ADMIN" ||
    (file.problem && canSeeProblem(file.problem, u)) ||
    (file.proposal &&
      (["SHORTLISTED", "APPROVED", "PILOT", "COMPLETED"].includes(file.proposal.status) ||
        u?.id === file.proposal.authorId ||
        file.proposal.team?.members.some((m) => m.accepted && m.userId === u?.id) ||
        (u?.role === "INSTITUTION" &&
          u.organization?.verified &&
          !!u.organizationId &&
          file.proposal.team?.organizationId === u.organizationId)));
  if (!allowed) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.mime,
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": `${file.mime === "application/pdf" ? "attachment" : "inline"}; filename="${file.name}"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}
