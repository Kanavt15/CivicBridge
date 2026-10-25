import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { z } from "zod";
import { categories } from "../src/lib/domain";
import { trainClassifier, evaluateClassifier, type Sample } from "../src/lib/ai/naive-bayes";
const path = process.argv[process.argv.indexOf("--dataset") + 1];
const inputPath = process.argv.includes("--dataset") ? path : "data/nyc311-civic.json";
if (!inputPath) throw new Error("Provide a dataset path after --dataset.");
const raw = readFileSync(inputPath, "utf8");
const dataset = z
  .object({
    name: z.string(),
    provenance: z.enum(["synthetic-demo", "reviewed-consented", "public-municipal-data"]),
    description: z.string(),
    license: z.string(),
    sourceUrl: z.url().optional(),
    termsUrl: z.url().optional(),
    retrievedAt: z.string().optional(),
    sourceHash: z.string().optional(),
    limitations: z.string().optional(),
    groups: z
      .array(
        z.object({
          category: z.enum(categories),
          train: z.array(z.string().min(5)).min(2),
          test: z.array(z.string().min(5)).min(1),
        }),
      )
      .min(2),
  })
  .parse(JSON.parse(raw));
if (new Set(dataset.groups.map((g) => g.category)).size !== dataset.groups.length)
  throw new Error("Use one group per category; unsupported categories may be omitted.");
const samples: Sample[] = dataset.groups.flatMap((g, i) => [
  ...g.train.map((text, j) => ({
    id: `${i}-train-${j}`,
    label: g.category,
    text,
    split: "train" as const,
  })),
  ...g.test.map((text, j) => ({
    id: `${i}-test-${j}`,
    label: g.category,
    text,
    split: "test" as const,
  })),
]);
const model = trainClassifier(samples),
  evaluation = evaluateClassifier(model, samples);
const card = {
  name: dataset.name,
  provenance: dataset.provenance,
  description: dataset.description,
  license: dataset.license,
  sourceUrl: dataset.sourceUrl ?? null,
  termsUrl: dataset.termsUrl ?? null,
  retrievedAt: dataset.retrievedAt ?? null,
  sourceHash: dataset.sourceHash ?? null,
  datasetHash: createHash("sha256").update(raw).digest("hex"),
  algorithm: "Multinomial Naive Bayes · Unicode words and bigrams · Laplace smoothing",
  trainingSamples: model.trainingSamples,
  vocabularySize: model.vocabulary.length,
  labels: model.labels,
  unsupportedCategories: categories.filter((c) => !model.labels.includes(c)),
  metrics: evaluation,
  limitations:
    dataset.limitations ??
    "Synthetic demonstration data. Held-out examples are distinct but share the authored demo domain. These metrics do not establish performance on real citizen reports. Scores are uncalibrated. Human review is required.",
};
mkdirSync("src/lib/ai/generated", { recursive: true });
const outputPath = process.argv.includes("--output")
  ? process.argv[process.argv.indexOf("--output") + 1]
  : "src/lib/ai/generated/model.json";
if (!outputPath) throw new Error("Provide an artifact path after --output.");
writeFileSync(outputPath, JSON.stringify({ model, card }, null, 2) + "\n");
console.log(
  `Trained ${model.trainingSamples} examples; evaluated ${evaluation.testSamples} separate held-out examples. Accuracy ${(evaluation.accuracy * 100).toFixed(1)}%; macro F1 ${evaluation.macroF1.toFixed(3)}. Dataset: ${dataset.provenance}.`,
);
console.log(`Saved ${outputPath}. No application records or external AI APIs were used.`);
