import { describe, it, expect } from "vitest";
import { measurementSchema, measuredChange } from "../../src/lib/impact-evidence";
import { reviewPriority, csvCell, filterQueue } from "../../src/lib/operations";
import { demoAccountsAllowed, productionIssues } from "../../src/lib/production";
import { limitedBody } from "../../src/lib/http";
import { integrationDatabase } from "../../src/lib/test-isolation";
import {
  tokens,
  trainClassifier,
  predict,
  evaluateClassifier,
  type Sample,
} from "../../src/lib/ai/naive-bayes";
import artifact from "../../src/lib/ai/generated/model.json";
import demoArtifact from "../../src/lib/ai/generated/demo-model.json";
const measurement = {
  collaborationId: "project-1",
  metric: "WATER_USAGE_LITRES",
  baseline: 1000,
  observed: 700,
  sampleSize: 20,
  periodStart: "2026-01-01",
  periodEnd: "2026-01-31",
  methodology: "Compared matched household meter samples over equivalent thirty-day periods.",
  evidenceUrl: "https://example.org/evidence",
};
describe("measured impact", () => {
  it("computes a reduction and preserves negative results", () => {
    expect(measuredChange("WATER_USAGE_LITRES", 1000, 700)).toMatchObject({
      delta: 300,
      percent: 30,
    });
    expect(measuredChange("WATER_USAGE_LITRES", 700, 1000).delta).toBe(-300);
  });
  it("computes increasing outcomes without inventing a percentage from zero", () => {
    expect(measuredChange("PEOPLE_SERVED", 0, 100)).toMatchObject({ delta: 100, percent: null });
  });
  it("requires comparable observed periods and public HTTPS evidence", () => {
    expect(measurementSchema.safeParse(measurement).success).toBe(true);
    for (const patch of [
      { evidenceUrl: "http://example.org" },
      { evidenceUrl: "https://user:secret@example.org" },
      { periodEnd: "2099-01-01" },
      { periodStart: "2026-02-01" },
      { sampleSize: 0 },
      { observed: Infinity },
    ])
      expect(measurementSchema.safeParse({ ...measurement, ...patch }).success).toBe(false);
  });
});
describe("explainable operations", () => {
  it("applies the same combined search and review filters to a queue or export", () => {
    const report = {
      title: "Water shortage",
      city: "Pune",
      state: "Maharashtra",
      category: "Water Conservation",
      urgency: "HIGH",
      status: "OPEN",
      isDemo: false,
      priority: { overdue: true },
    };
    const filters = {
      query: " maharashtra ",
      urgency: "HIGH",
      status: "OPEN",
      overdue: true,
      hideDemo: true,
    };
    expect(
      filterQueue(
        [
          report,
          { ...report, isDemo: true },
          { ...report, urgency: "LOW" },
          { ...report, priority: { overdue: false } },
        ],
        filters,
      ),
    ).toEqual([report]);
    expect(filterQueue([report], { ...filters, status: "REPORTED" })).toEqual([]);
  });
  it("exposes its scoring components and caps the score", () => {
    const p = reviewPriority({
      urgency: "CRITICAL",
      population: 1e8,
      createdAt: "2020-01-01",
      _count: { votes: 10000 },
    });
    expect(p.score).toBe(100);
    expect(p.score).toBe(Object.values(p.parts).reduce((a, b) => a + b, 0));
    expect(p.overdue).toBe(true);
  });
  it("does not create negative age or priority for future dates", () => {
    expect(
      reviewPriority({
        urgency: "LOW",
        population: 1,
        createdAt: "2099-01-01",
        _count: { votes: 0 },
      }).score,
    ).toBe(0);
  });
  it("escapes formulas, commas, and quotes in exports", () => {
    expect(csvCell('=HYPERLINK("https://evil")').startsWith("\"'=")).toBe(true);
    expect(csvCell(" +SUM(A1)").startsWith("\"'")).toBe(true);
    expect(csvCell('a,"b"')).toBe('"a,""b"""');
  });
});
describe("deployment controls", () => {
  it("advertises test identity only for explicit disposable local databases", () => {
    expect(
      integrationDatabase({
        CIVICBRIDGE_TEST_MODE: "true",
        DATABASE_URL: "mongodb://127.0.0.1:27018/civicbridge_test",
      }),
    ).toBe("civicbridge_test");
    for (const url of [
      "mongodb+srv://a:b@cluster.mongodb.net/civicbridge_test",
      "mongodb://127.0.0.1:27018/civicbridge",
      "mongodb://127.0.0.1:27018/civicbridge_testproduction",
    ])
      expect(integrationDatabase({ CIVICBRIDGE_TEST_MODE: "true", DATABASE_URL: url })).toBeNull();
    expect(
      integrationDatabase({ DATABASE_URL: "mongodb://localhost/civicbridge_test" }),
    ).toBeNull();
  });
  it("blocks demo authentication by default in production", () => {
    expect(demoAccountsAllowed({ NODE_ENV: "production" })).toBe(false);
    expect(demoAccountsAllowed({ NODE_ENV: "production", ALLOW_DEMO_ACCOUNTS: "true" })).toBe(true);
    expect(demoAccountsAllowed({ NODE_ENV: "development" })).toBe(true);
  });
  it("rejects placeholder secrets and non-canonical origins", () => {
    expect(
      productionIssues({
        DATABASE_URL: "mongodb://localhost/civicbridge",
        AUTH_SECRET: "replace-this",
        AUTH_URL: "http://localhost:3000",
        AUTH_TRUST_HOST: "true",
      }),
    ).toHaveLength(2);
    expect(
      productionIssues({
        DATABASE_URL: "mongodb+srv://app:secret@cluster.mongodb.net/civicbridge",
        AUTH_SECRET: "a-test-secret-that-is-more-than-thirty-two-characters",
        AUTH_URL: "https://civicbridge.example.org",
        AUTH_TRUST_HOST: "true",
      }),
    ).toEqual([]);
  });
  it("limits streamed bodies even without a content-length header", async () => {
    const req = new Request("http://localhost", { method: "POST", body: "x".repeat(1024) });
    await expect(limitedBody(req, 100)).rejects.toMatchObject({ status: 413 });
  });
});
describe("a reproducible and reviewable classifier", () => {
  const samples: Sample[] = [
    {
      id: "a",
      text: "drinking water borewell village water shortage",
      label: "Water",
      split: "train",
    },
    { id: "b", text: "water tankers drinking reservoir shortage", label: "Water", split: "test" },
    {
      id: "c",
      text: "school teacher classroom student learning",
      label: "Education",
      split: "train",
    },
    {
      id: "d",
      text: "classroom teacher student lessons education",
      label: "Education",
      split: "test",
    },
  ];
  it("keeps Hindi characters and learns only training examples", () => {
    expect(tokens("गांव में पानी की कमी है")).toContain("पानी");
    const m = trainClassifier(samples);
    expect(m.trainingSamples).toBe(2);
    expect(m.vocabulary).not.toContain("reservoir");
    expect(predict(m, "school teacher classroom learning").category).toBe("Education");
  });
  it("rejects duplicated text across partitions", () => {
    expect(() =>
      trainClassifier([...samples, { ...samples[0], id: "duplicate", split: "test" }]),
    ).toThrow("leak");
  });
  it("abstains when the input does not overlap its learned vocabulary", () => {
    expect(predict(trainClassifier(samples), "unseen vocabulary xyzzy quux").abstained).toBe(true);
  });
  it("reports actual held-out counts and macro scores", () => {
    const e = evaluateClassifier(trainClassifier(samples), samples);
    expect(e.testSamples).toBe(2);
    expect(e.macroF1).toBeGreaterThanOrEqual(0);
    expect(e.macroF1).toBeLessThanOrEqual(1);
    expect(e.confusion.Water).toBeDefined();
  });
  it("separates public municipal training from the synthetic bilingual demo", () => {
    expect(artifact.card.provenance).toBe("public-municipal-data");
    expect(artifact.card.trainingSamples).toBe(391);
    expect(artifact.card.metrics.testSamples).toBe(112);
    expect(artifact.card.unsupportedCategories).toContain("Agriculture");
    expect(artifact.card.limitations).toContain("do not establish accuracy");
    expect(demoArtifact.card.provenance).toBe("synthetic-demo");
    expect(demoArtifact.card.trainingSamples).toBe(80);
    expect(demoArtifact.card.metrics.testSamples).toBe(20);
  });
});
