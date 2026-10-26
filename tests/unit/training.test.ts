import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { trainSelectedClassifier } from "../../src/lib/ai/training";
import { predict, type Sample } from "../../src/lib/ai/naive-bayes";
const corpus = JSON.parse(readFileSync("data/nyc311-civic.json", "utf8"));
const samples: Sample[] = corpus.groups.flatMap(
  (g: { category: string; train: string[]; test: string[] }, i: number) => [
    ...g.train.map((text, j) => ({
      id: `${i}-train-${j}`,
      text,
      label: g.category,
      split: "train" as const,
    })),
    ...g.test.map((text, j) => ({
      id: `${i}-test-${j}`,
      text,
      label: g.category,
      split: "test" as const,
    })),
  ],
);
describe("training-only model selection", () => {
  it("does not change fitted weights or selection when reserved test inputs change", () => {
    const trained = trainSelectedClassifier(samples);
    const modified = samples.map((s, i) =>
      s.split === "test" ? { ...s, text: `reserved neverlearnedtoken example ${i}` } : s,
    );
    expect(trainSelectedClassifier(modified)).toEqual(trained);
    expect(trained.model.vocabulary).not.toContain("neverlearnedtoken");
    expect(trained.selection.comparisons).toHaveLength(6);
  });
  it("keeps scores finite and abstains on unseen scripts", () => {
    const { model } = trainSelectedClassifier(samples);
    const result = predict(model, "量子計算機理論実験検証");
    expect(result.abstained).toBe(true);
    expect(
      result.scores.every((s) => Number.isFinite(s.score) && s.score >= 0 && s.score <= 1),
    ).toBe(true);
  });
});
