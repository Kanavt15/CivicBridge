export const categories = [
  "Waste Management",
  "Water Conservation",
  "Education",
  "Healthcare",
  "Infrastructure",
  "Agriculture",
  "Environment",
  "Public Safety",
  "Transportation",
  "Other",
] as const;
export const roles = ["CITIZEN", "RESEARCHER", "INSTITUTION", "INDUSTRY", "ADMIN"] as const;
export const publicStatuses = ["OPEN", "COLLABORATION", "PILOT", "RESOLVED"] as const;
export const urgencyRanks: Record<string, number> = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };
export const problemTransitions: Record<string, string[]> = {
  REPORTED: ["UNDER_REVIEW", "REJECTED"],
  UNDER_REVIEW: ["OPEN", "REJECTED"],
  OPEN: ["COLLABORATION", "REJECTED"],
  COLLABORATION: ["PILOT"],
  PILOT: ["RESOLVED"],
  RESOLVED: [],
  REJECTED: [],
};
export const proposalTransitions: Record<string, string[]> = {
  SUBMITTED: ["UNDER_REVIEW", "REJECTED"],
  UNDER_REVIEW: ["SHORTLISTED", "REJECTED"],
  SHORTLISTED: ["APPROVED", "REJECTED"],
  APPROVED: ["PILOT"],
  PILOT: ["COMPLETED"],
  COMPLETED: [],
  REJECTED: [],
};
export function impactScore(
  p: { urgency: string; population: number; status: string },
  feasibility = 0,
) {
  const urgency =
    ({ LOW: 8, MEDIUM: 16, HIGH: 24, CRITICAL: 30 } as Record<string, number>)[p.urgency] ?? 0;
  const population = Math.min(25, Math.round(Math.log10(Math.max(1, p.population)) * 7));
  const progress =
    (
      {
        REPORTED: 0,
        UNDER_REVIEW: 3,
        OPEN: 5,
        COLLABORATION: 12,
        PILOT: 20,
        RESOLVED: 30,
      } as Record<string, number>
    )[p.status] ?? 0;
  const readiness = Math.min(15, Math.max(0, feasibility));
  return {
    total: urgency + population + progress + readiness,
    urgency,
    population,
    progress,
    readiness,
  };
}
const rules: [string, RegExp][] = [
  ["Water Conservation", /water|drought|drinking|borewell|reservoir|rainwater/i],
  ["Waste Management", /waste|garbage|rubbish|landfill|recycl/i],
  ["Agriculture", /farm|crop|irrigat|soil|agricultur/i],
  ["Healthcare", /hospital|health|medical|disease|clinic/i],
  ["Education", /school|student|education|classroom/i],
  ["Transportation", /bus|transport|traffic|commut|mobility/i],
  ["Public Safety", /crime|unsafe|assault|safety/i],
  ["Infrastructure", /road|pothole|bridge|drain|streetlight/i],
  ["Environment", /pollut|tree|forest|environment|air quality/i],
];
export function suggest(text: string) {
  const category = rules.find(([, pattern]) => pattern.test(text))?.[0] ?? "Other";
  const urgency = /death|fatal|toxic|emergency|contaminated|life.threatening/i.test(text)
    ? "CRITICAL"
    : /urgent|severe|shortage|unsafe|flood/i.test(text)
      ? "HIGH"
      : "MEDIUM";
  return {
    category,
    urgency,
    source: "Rule-based suggestion",
    explanation: "Keyword matching; review the suggested category and urgency before submitting.",
  };
}
export function similarity(a: string, b: string) {
  const words = (s: string) =>
    new Set(
      s
        .toLowerCase()
        .match(/\b[a-z]{3,}\b/g)
        ?.filter(
          (w) =>
            !["the", "and", "for", "with", "from", "this", "that", "are", "has", "have"].includes(
              w,
            ),
        ) ?? [],
    );
  const aa = words(a),
    bb = words(b);
  const union = new Set([...aa, ...bb]);
  return union.size ? [...aa].filter((w) => bb.has(w)).length / union.size : 0;
}
export function distanceKm(a: number, b: number, c: number, d: number) {
  const r = Math.PI / 180;
  const x =
    Math.sin(((c - a) * r) / 2) ** 2 +
    Math.cos(a * r) * Math.cos(c * r) * Math.sin(((d - b) * r) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}
export function matchScore(
  skills: string[],
  interests: string[],
  p: { title: string; description: string; category: string },
) {
  return Math.round(
    Math.min(
      100,
      (interests.includes(p.category) ? 60 : 0) +
        similarity(skills.join(" "), p.title + " " + p.description) * 100,
    ),
  );
}
