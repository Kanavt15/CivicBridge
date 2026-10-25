import { db } from "./db";
import { publicStatuses } from "./domain";
export async function platformStats() {
  const where = { status: { in: [...publicStatuses] } };
  const [
    problems,
    resolved,
    innovations,
    organizations,
    contributors,
    demo,
    reports,
    categories,
    regions,
  ] = await Promise.all([
    db.problem.count({ where }),
    db.problem.count({ where: { status: "RESOLVED" } }),
    db.solutionProposal.count({ where: { status: { in: ["APPROVED", "PILOT", "COMPLETED"] } } }),
    db.organization.count({ where: { verified: true } }),
    db.user.count({ where: { active: true } }),
    db.problem.count({ where: { ...where, isDemo: true } }),
    db.problem.findMany({ where, select: { createdAt: true, status: true, population: true } }),
    db.problem.groupBy({ by: ["category"], where, _count: true }),
    db.problem.groupBy({ by: ["state"], where, _count: true }),
  ]);
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setUTCMonth(d.getUTCMonth() - 5 + i, 1);
    return {
      name: d.toLocaleString("en-IN", { month: "short", timeZone: "UTC" }),
      key: d.toISOString().slice(0, 7),
      reported: 0,
      resolved: 0,
    };
  });
  for (const p of reports) {
    const m = months.find((m) => m.key === p.createdAt.toISOString().slice(0, 7));
    if (m) {
      m.reported++;
      if (p.status === "RESOLVED") m.resolved++;
    }
  }
  return {
    problems,
    resolved,
    innovations,
    organizations,
    contributors,
    demo,
    population: reports
      .filter((p) => p.status === "RESOLVED")
      .reduce((s, p) => s + p.population, 0),
    months,
    categories: categories.map((c) => ({ name: c.category, value: c._count })),
    regions: regions.map((r) => ({ name: r.state, value: r._count })),
  };
}
