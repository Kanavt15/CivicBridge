import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { evaluateClassifier, type Sample, type CivicModel } from "./naive-bayes";
import { trainSelectedClassifier } from "./training";

type Dataset = {
  sourceHash: string;
  retrievedAt: string;
  provenance: string;
  groups: { category: string; train: string[]; test: string[] }[];
};
type Artifact = {
  model: CivicModel;
  card: {
    sourceHash: string | null;
    datasetHash: string;
    provenance: string;
    trainingSamples: number;
    metrics: ReturnType<typeof evaluateClassifier>;
    selection: ReturnType<typeof trainSelectedClassifier>["selection"];
  };
};
export const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

// Checks the entire lineage, rather than trusting the model card's reported metrics.
export function inspectPipeline(sourceRaw: string, datasetRaw: string, artifactRaw: string) {
  const source = JSON.parse(sourceRaw);
  const dataset: Dataset = JSON.parse(datasetRaw);
  const artifact: Artifact = JSON.parse(artifactRaw);
  if (!Array.isArray(source.rows) || !source.rows.length)
    throw new Error("Source snapshot must contain aggregate rows.");
  if (
    dataset.provenance !== "public-municipal-data" ||
    artifact.card.provenance !== dataset.provenance
  )
    throw new Error("The public pipeline must retain municipal-data provenance.");
  const sourceHash = sha256(sourceRaw),
    datasetHash = sha256(datasetRaw);
  if (dataset.sourceHash !== sourceHash || artifact.card.sourceHash !== sourceHash)
    throw new Error("Source fingerprint mismatch; prepare and train again.");
  if (artifact.card.datasetHash !== datasetHash)
    throw new Error("Dataset fingerprint mismatch; train again.");
  if (
    source.retrievedAt !== dataset.retrievedAt ||
    !Number.isFinite(Date.parse(dataset.retrievedAt))
  )
    throw new Error("Source retrieval timestamp mismatch.");
  if (new Set(dataset.groups.map((g) => g.category)).size !== dataset.groups.length)
    throw new Error("Dataset categories must be unique.");
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
  const { model: expectedModel, selection } = trainSelectedClassifier(samples);
  if (!isDeepStrictEqual(expectedModel, artifact.model))
    throw new Error("Model differs from deterministic training output.");
  if (!isDeepStrictEqual(selection, artifact.card.selection))
    throw new Error("Model selection differs from training-only cross-validation.");
  const metrics = evaluateClassifier(expectedModel, samples);
  if (
    !isDeepStrictEqual(metrics, artifact.card.metrics) ||
    artifact.card.trainingSamples !== expectedModel.trainingSamples
  )
    throw new Error("Model card metrics differ from held-out evaluation.");
  if (
    metrics.accuracy <= metrics.majorityBaseline ||
    metrics.macroF1 < 0.45 ||
    metrics.coverage < 0.5
  )
    throw new Error(
      "Model fails the baseline quality gate; review data and taxonomy before promotion.",
    );
  return {
    version: 1,
    source: "NYC Open Data / NYC311",
    retrievedAt: dataset.retrievedAt,
    sourceHash,
    datasetHash,
    artifactHash: sha256(artifactRaw),
    sourceRows: source.rows.length,
    trainingSamples: expectedModel.trainingSamples,
    testSamples: metrics.testSamples,
    categories: expectedModel.labels,
    metrics: {
      accuracy: metrics.accuracy,
      macroF1: metrics.macroF1,
      coverage: metrics.coverage,
      majorityBaseline: metrics.majorityBaseline,
    },
    gates: { beatsMajority: true, minimumMacroF1: 0.45, minimumCoverage: 0.5 },
  };
}
