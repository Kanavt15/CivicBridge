import { urgencyRanks } from "./domain";
export const reviewHours: Record<string, number> = {
  CRITICAL: 24,
  HIGH: 72,
  MEDIUM: 168,
  LOW: 336,
};
export function reviewPriority(
  p: { urgency: string; population: number; createdAt: Date | string; _count: { votes: number } },
  now = Date.now(),
) {
  const ageHours = Math.max(0, (now - new Date(p.createdAt).getTime()) / 3600000);
  const parts = {
    urgency: Math.round(((urgencyRanks[p.urgency] ?? 0) / 3) * 45),
    population: Math.min(25, Math.round(Math.log10(Math.max(1, p.population)) * 6)),
    age: Math.min(20, Math.floor(ageHours / 24)),
    community: Math.min(10, p._count.votes),
  };
  const targetHours = reviewHours[p.urgency] ?? 168;
  return {
    score: Object.values(parts).reduce((s, n) => s + n, 0),
    parts,
    ageHours: Math.round(ageHours),
    overdue: ageHours > targetHours,
    targetHours,
  };
}
export function csvCell(value: unknown) {
  let text = String(value ?? "");
  if (/^[\s]*[=+@\-\t\r]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}

export type QueueFilters = {
  query: string;
  overdue: boolean;
  urgency: string;
  status: string;
  hideDemo: boolean;
};
export function filterQueue<
  T extends {
    title: string;
    city: string;
    state: string;
    category: string;
    urgency: string;
    status: string;
    isDemo: boolean;
    priority: { overdue: boolean };
  },
>(items: T[], filters: QueueFilters) {
  const query = filters.query.trim().toLowerCase();
  return items.filter(
    (p) =>
      (!filters.overdue || p.priority.overdue) &&
      (!filters.hideDemo || !p.isDemo) &&
      (!filters.urgency || p.urgency === filters.urgency) &&
      (!filters.status || p.status === filters.status) &&
      `${p.title} ${p.city} ${p.state} ${p.category}`.toLowerCase().includes(query),
  );
}
