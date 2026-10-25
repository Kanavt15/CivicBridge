import { z } from "zod";
export const impactMetrics = {
  WATER_USAGE_LITRES: { name: "Water used", unit: "litres", direction: "decrease" },
  LANDFILL_WASTE_KG: { name: "Waste sent to landfill", unit: "kg", direction: "decrease" },
  JOURNEY_TIME_MINUTES: { name: "Journey time", unit: "minutes", direction: "decrease" },
  HOUSEHOLDS_WITH_WATER: {
    name: "Households with reliable water",
    unit: "households",
    direction: "increase",
  },
  STUDENTS_REACHED: { name: "Students supported", unit: "students", direction: "increase" },
  PEOPLE_SERVED: { name: "People served", unit: "people", direction: "increase" },
} as const;
export type ImpactMetric = keyof typeof impactMetrics;
export const measurementSchema = z
  .object({
    collaborationId: z.string().min(1),
    metric: z.enum(Object.keys(impactMetrics) as [ImpactMetric, ...ImpactMetric[]]),
    baseline: z.number().finite().min(0).max(1e12),
    observed: z.number().finite().min(0).max(1e12),
    sampleSize: z.number().int().min(1).max(100000000),
    periodStart: z.coerce.date(),
    periodEnd: z.coerce.date(),
    methodology: z.string().trim().min(40).max(5000),
    evidenceUrl: z
      .url()
      .max(2048)
      .refine((value) => {
        const u = new URL(value);
        return u.protocol === "https:" && !u.username && !u.password;
      }, "Use a public HTTPS evidence link without embedded credentials."),
  })
  .superRefine((v, c) => {
    if (v.periodStart > v.periodEnd)
      c.addIssue({
        code: "custom",
        message: "The period end must follow its start.",
        path: ["periodEnd"],
      });
    if (v.periodEnd.getTime() > Date.now())
      c.addIssue({
        code: "custom",
        message: "Record observed outcomes for a completed measurement period.",
        path: ["periodEnd"],
      });
  });
export function measuredChange(metric: ImpactMetric, baseline: number, observed: number) {
  const delta =
    impactMetrics[metric].direction === "decrease" ? baseline - observed : observed - baseline;
  return {
    delta,
    percent: baseline === 0 ? null : Math.round((delta / baseline) * 1000) / 10,
    unit: impactMetrics[metric].unit,
  };
}
