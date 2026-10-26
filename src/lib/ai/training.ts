import { createHash } from "node:crypto";
import {
  trainClassifier,
  evaluateClassifier,
  validateSamples,
  type Sample,
  type ClassifierConfig,
} from "./naive-bayes";

const candidates: ClassifierConfig[] = [
  { features: "words", variant: "multinomial", prior: "empirical" },
  { features: "words", variant: "multinomial", prior: "uniform" },
  { features: "words", variant: "complement", prior: "uniform" },
  { features: "words-and-characters", variant: "multinomial", prior: "empirical" },
  { features: "words-and-characters", variant: "multinomial", prior: "uniform" },
  { features: "words-and-characters", variant: "complement", prior: "uniform" },
];
const hash = (text: string) =>
  createHash("sha256").update(text.normalize("NFKC").toLowerCase()).digest("hex");

// Hyperparameters are selected solely from training descriptors. The reserved
// test partition does not participate in folds, feature fitting, or selection.
export function trainSelectedClassifier(samples: Sample[]) {
  validateSamples(samples);
  const training = samples.filter((s) => s.split === "train");
  const labels = [...new Set(training.map((s) => s.label))].sort();
  const folds = 5;
  const assignments = new Map<string, number>();
  for (const label of labels) {
    const group = training
      .filter((s) => s.label === label)
      .sort((a, b) => hash(a.text).localeCompare(hash(b.text)));
    if (group.length < folds)
      throw new Error("Model selection requires at least five training examples per category.");
    group.forEach((s, i) => assignments.set(s.id, i % folds));
  }
  const comparisons = candidates.map((config) => {
    const scores = Array.from({ length: folds }, (_, fold) => {
      const partition: Sample[] = training.map((s) => ({
        ...s,
        split: assignments.get(s.id) === fold ? "test" : "train",
      }));
      return evaluateClassifier(trainClassifier(partition, config), partition);
    });
    return {
      config,
      macroF1: scores.reduce((s, m) => s + m.macroF1, 0) / folds,
      accuracy: scores.reduce((s, m) => s + m.accuracy, 0) / folds,
    };
  });
  const selected = [...comparisons].sort(
    (a, b) => b.macroF1 - a.macroF1 || b.accuracy - a.accuracy,
  )[0];
  return {
    model: trainClassifier(samples, selected.config),
    selection: {
      method: "Five-fold stratified cross-validation on training descriptors only",
      folds,
      selectionMetric: "macro F1",
      selectedConfig: selected.config,
      comparisons,
    },
  };
}
