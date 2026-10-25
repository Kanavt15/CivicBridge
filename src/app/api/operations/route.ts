import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { reviewPriority, csvCell, filterQueue } from "@/lib/operations";
import { json, failure, noStore } from "@/lib/http";
export async function GET(req: NextRequest) {
  try {
    await requireUser(["ADMIN"]);
    const where = {
      status: {
        in: ["REPORTED", "UNDER_REVIEW", "OPEN"] as ("REPORTED" | "UNDER_REVIEW" | "OPEN")[],
      },
    };
    const [total, items] = await Promise.all([
      db.problem.count({ where }),
      db.problem.findMany({
        where,
        include: { _count: { select: { votes: true, proposals: true } } },
        take: 500,
        orderBy: [{ urgencyRank: "desc" }, { createdAt: "asc" }],
      }),
    ]);
    const ranked = items
      .map((p) => ({ ...p, priority: reviewPriority(p) }))
      .sort(
        (a, b) =>
          b.priority.score - a.priority.score || a.createdAt.getTime() - b.createdAt.getTime(),
      );
    const params = req.nextUrl.searchParams;
    const filtered = filterQueue(ranked, {
      query: (params.get("q") ?? "").slice(0, 200),
      overdue: params.get("overdue") === "true",
      hideDemo: params.get("hideDemo") === "true",
      urgency: params.get("urgency") ?? "",
      status: params.get("status") ?? "",
    });
    if (params.get("format") === "csv") {
      const rows = [
        [
          "Reference",
          "Challenge",
          "Category",
          "City",
          "State",
          "Urgency",
          "Status",
          "People affected",
          "Priority",
          "Age hours",
          "Review target exceeded",
        ],
        ...filtered.map((p) => [
          p.id,
          p.title,
          p.category,
          p.city,
          p.state,
          p.urgency,
          p.status,
          p.population,
          p.priority.score,
          p.priority.ageHours,
          p.priority.overdue,
        ]),
      ];
      return new Response(rows.map((row) => row.map(csvCell).join(",")).join("\r\n"), {
        headers: {
          ...noStore,
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": "attachment; filename=civicbridge-review-queue.csv",
        },
      });
    }
    const locations = new Map<
      string,
      { city: string; state: string; reports: number; critical: number }
    >();
    for (const p of ranked) {
      const key = `${p.city.toLowerCase()}:${p.state.toLowerCase()}`;
      const region = locations.get(key) ?? {
        city: p.city,
        state: p.state,
        reports: 0,
        critical: 0,
      };
      region.reports++;
      if (p.urgency === "CRITICAL") region.critical++;
      locations.set(key, region);
    }
    return json({
      total,
      items: filtered,
      overdue: ranked.filter((p) => p.priority.overdue).length,
      withoutSolutions: ranked.filter((p) => !p._count.proposals).length,
      hotspots: [...locations.values()].sort((a, b) => b.reports - a.reports),
      limit: 500,
    });
  } catch (error) {
    return failure(error);
  }
}
