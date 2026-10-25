import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { inspectPipeline, sha256 } from "../../src/lib/ai/pipeline";

const source = readFileSync("data/sources/nyc311-2025-descriptors.json", "utf8");
const dataset = readFileSync("data/nyc311-civic.json", "utf8");
const artifact = readFileSync("src/lib/ai/generated/model.json", "utf8");
describe("release data lineage", () => {
  it("reconstructs training and held-out evaluation from the pinned snapshot", () => {
    expect(inspectPipeline(source, dataset, artifact)).toMatchObject({
      sourceRows: 1121,
      trainingSamples: 391,
      testSamples: 112,
      artifactHash: sha256(artifact),
      gates: { beatsMajority: true },
    });
  });
  it("rejects source drift even if the JSON remains valid", () => {
    expect(() => inspectPipeline(source + "\n", dataset, artifact)).toThrow(
      "Source fingerprint mismatch",
    );
  });
  it("rejects untrained dataset edits", () => {
    expect(() => inspectPipeline(source, dataset + "\n", artifact)).toThrow(
      "Dataset fingerprint mismatch",
    );
  });
  it("detects tampered model weights despite unchanged lineage metadata", () => {
    const edited = JSON.parse(artifact);
    edited.model.documents[edited.model.labels[0]]++;
    expect(() => inspectPipeline(source, dataset, JSON.stringify(edited))).toThrow(
      "deterministic training",
    );
  });
  it("detects inflated evaluation metrics", () => {
    const edited = JSON.parse(artifact);
    edited.card.metrics.accuracy = 1;
    expect(() => inspectPipeline(source, dataset, JSON.stringify(edited))).toThrow(
      "held-out evaluation",
    );
  });
  it("rejects cross-partition leakage even when dataset fingerprints are updated", () => {
    const editedDataset = JSON.parse(dataset),
      editedArtifact = JSON.parse(artifact);
    editedDataset.groups[0].test.push(editedDataset.groups[0].train[0]);
    const raw = JSON.stringify(editedDataset);
    editedArtifact.card.datasetHash = sha256(raw);
    expect(() => inspectPipeline(source, raw, JSON.stringify(editedArtifact))).toThrow("leak");
  });
  it("never promotes synthetic data through the municipal pipeline", () => {
    const edited = JSON.parse(dataset);
    edited.provenance = "synthetic-demo";
    expect(() => inspectPipeline(source, JSON.stringify(edited), artifact)).toThrow("provenance");
  });
});
