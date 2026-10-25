import { describe, it, expect } from "vitest";
import {
  suggest,
  similarity,
  distanceKm,
  impactScore,
  problemTransitions,
  proposalTransitions,
  matchScore,
  urgencyRanks,
} from "../../src/lib/domain";
import { problemSchema, registerSchema, proposalSchema } from "../../src/lib/validation";
describe("transparent assistance", () => {
  it("labels its fallback and identifies contaminated water as critical", () => {
    expect(suggest("Contaminated drinking water in the village")).toMatchObject({
      category: "Water Conservation",
      urgency: "CRITICAL",
      source: "Rule-based suggestion",
    });
  });
  it("does not invent a category for unrecognized issues", () => {
    expect(suggest("A novel societal challenge").category).toBe("Other");
  });
  it("finds lexical overlap, handles empty input and ignores common words", () => {
    expect(similarity("water shortage village", "village water shortage")).toBe(1);
    expect(similarity("", "water")).toBe(0);
    expect(similarity("the and for", "and the for")).toBe(0);
    expect(similarity("village water", "city school")).toBe(0);
  });
  it("measures geographic proximity", () => {
    expect(distanceKm(19, 72, 19, 72)).toBe(0);
    expect(distanceKm(19.076, 72.8777, 18.5204, 73.8567)).toBeGreaterThan(100);
    expect(distanceKm(19.076, 72.8777, 18.5204, 73.8567)).toBeLessThan(150);
  });
  it("matches by declared interests and skills", () => {
    expect(
      matchScore(["water"], ["Water Conservation"], {
        title: "Water",
        description: "water monitoring",
        category: "Water Conservation",
      }),
    ).toBeGreaterThan(60);
    expect(
      matchScore([], [], {
        title: "Water",
        description: "monitoring",
        category: "Water Conservation",
      }),
    ).toBe(0);
  });
});
describe("impact and controlled workflows", () => {
  it("sorts urgency by severity independently of alphabetical enum order", () => {
    expect(
      ["MEDIUM", "CRITICAL", "LOW", "HIGH"].sort((a, b) => urgencyRanks[b] - urgencyRanks[a]),
    ).toEqual(["CRITICAL", "HIGH", "MEDIUM", "LOW"]);
  });
  it("caps impact at 100 and exposes a consistent breakdown", () => {
    const score = impactScore(
      { urgency: "CRITICAL", population: 100000000, status: "RESOLVED" },
      50,
    );
    expect(score.total).toBe(100);
    expect(score.total).toBe(score.urgency + score.population + score.progress + score.readiness);
  });
  it("does not grant readiness to unapproved work", () => {
    expect(impactScore({ urgency: "LOW", population: 1, status: "REPORTED" }).readiness).toBe(0);
  });
  it("requires review and prevents reopening terminal outcomes", () => {
    expect(problemTransitions.REPORTED).not.toContain("RESOLVED");
    expect(problemTransitions.RESOLVED).toEqual([]);
    expect(proposalTransitions.SUBMITTED).not.toContain("APPROVED");
    expect(proposalTransitions.COMPLETED).toEqual([]);
  });
});
describe("server input validation", () => {
  const input = {
    title: "Water shortage in the village",
    description: "The village needs a reliable source of drinking water throughout the summer.",
    category: "Water Conservation",
    urgency: "HIGH",
    state: "Rajasthan",
    city: "Kheda",
    area: "Village center",
    latitude: 26.91,
    longitude: 75.78,
    population: 850,
  };
  it("accepts a complete valid report", () => {
    expect(problemSchema.parse(input).imageIds).toEqual([]);
  });
  it("rejects invalid coordinates and arbitrary categories", () => {
    expect(problemSchema.safeParse({ ...input, latitude: 100 }).success).toBe(false);
    expect(problemSchema.safeParse({ ...input, category: "Unvalidated" }).success).toBe(false);
  });
  it("rejects excessive attachments and non-integer population", () => {
    expect(problemSchema.safeParse({ ...input, imageIds: ["1", "2", "3", "4", "5"] }).success).toBe(
      false,
    );
    expect(problemSchema.safeParse({ ...input, population: 1.2 }).success).toBe(false);
  });
  it("cannot register an administrator", () => {
    expect(
      registerSchema.safeParse({
        name: "Attacker",
        email: "test@example.com",
        password: "StrongPassword123",
        role: "ADMIN",
      }).success,
    ).toBe(false);
  });
  it("requires an organization for institution accounts and a strong password", () => {
    expect(
      registerSchema.safeParse({
        name: "Institution",
        email: "test@example.com",
        password: "StrongPassword123",
        role: "INSTITUTION",
      }).success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({
        name: "Citizen",
        email: "test@example.com",
        password: "weak",
        role: "CITIZEN",
      }).success,
    ).toBe(false);
  });
  it("rejects empty or unsubstantiated proposals", () => {
    expect(proposalSchema.safeParse({ title: "A great idea", approach: "Use AI" }).success).toBe(
      false,
    );
  });
});
