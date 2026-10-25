export type Sample = { id: string; text: string; label: string; split: "train" | "test" };
export type CivicModel = {
  version: 1;
  labels: string[];
  vocabulary: string[];
  documents: Record<string, number>;
  counts: Record<string, Record<string, number>>;
  totals: Record<string, number>;
  trainingSamples: number;
};
const stop = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "this",
  "that",
  "are",
  "has",
  "have",
  "our",
  "need",
  "needs",
  "there",
  "their",
  "का",
  "की",
  "के",
  "में",
  "है",
  "हैं",
  "को",
  "से",
  "और",
  "लिए",
]);
export function tokens(text: string) {
  const words = (
    text
      .normalize("NFKC")
      .toLowerCase()
      .match(/[\p{L}\p{M}\p{N}]+/gu) ?? []
  ).filter((w) => w.length > 1 && !stop.has(w));
  return [...words, ...words.slice(1).map((w, i) => `${words[i]}_${w}`)];
}
export function validateSamples(samples: Sample[]) {
  const ids = new Set<string>(),
    texts = new Set<string>();
  for (const s of samples) {
    if (ids.has(s.id)) throw new Error("Duplicate dataset ID.");
    ids.add(s.id);
    const key = s.text
      .normalize("NFKC")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\p{M}]/gu, "");
    if (texts.has(key))
      throw new Error("Duplicate report text would leak between dataset partitions.");
    texts.add(key);
    if (tokens(s.text).length < 3)
      throw new Error("Training examples need meaningful report text.");
  }
  const labels = [...new Set(samples.map((s) => s.label))];
  for (const label of labels)
    if (
      !samples.some((s) => s.label === label && s.split === "train") ||
      !samples.some((s) => s.label === label && s.split === "test")
    )
      throw new Error("Every category needs separate training and held-out test examples.");
}
export function trainClassifier(samples: Sample[]): CivicModel {
  validateSamples(samples);
  const training = samples.filter((s) => s.split === "train"),
    labels = [...new Set(training.map((s) => s.label))].sort();
  const documents: Record<string, number> = {},
    counts: Record<string, Record<string, number>> = {},
    totals: Record<string, number> = {},
    vocabulary = new Set<string>();
  for (const label of labels) {
    documents[label] = 0;
    counts[label] = {};
    totals[label] = 0;
  }
  for (const sample of training) {
    documents[sample.label]++;
    for (const token of tokens(sample.text)) {
      vocabulary.add(token);
      counts[sample.label][token] = (counts[sample.label][token] ?? 0) + 1;
      totals[sample.label]++;
    }
  }
  return {
    version: 1,
    labels,
    vocabulary: [...vocabulary].sort(),
    documents,
    counts,
    totals,
    trainingSamples: training.length,
  };
}
export function predict(model: CivicModel, text: string) {
  const vocabulary = new Set(model.vocabulary),
    all = tokens(text),
    known = all.filter((t) => vocabulary.has(t));
  const ranked = model.labels
    .map((label) => ({
      label,
      logScore:
        Math.log(model.documents[label] / model.trainingSamples) +
        known.reduce(
          (sum, t) =>
            sum +
            Math.log(((model.counts[label][t] ?? 0) + 1) / (model.totals[label] + vocabulary.size)),
          0,
        ),
    }))
    .sort((a, b) => b.logScore - a.logScore);
  const max = ranked[0]?.logScore ?? 0,
    total = ranked.reduce((sum, r) => sum + Math.exp(r.logScore - max), 0);
  const scores = ranked.map((r) => ({
    category: r.label,
    score: total ? Math.exp(r.logScore - max) / total : 0,
  }));
  const coverage = all.length ? known.length / all.length : 0,
    margin = (scores[0]?.score ?? 0) - (scores[1]?.score ?? 0);
  const cues = [...new Set(known)]
    .filter((t) => !t.includes("_"))
    .map((token) => ({
      token,
      strength:
        Math.log(
          ((model.counts[scores[0]?.category]?.[token] ?? 0) + 1) /
            (model.totals[scores[0]?.category] + vocabulary.size),
        ) -
        Math.log(
          ((model.counts[scores[1]?.category]?.[token] ?? 0) + 1) /
            (model.totals[scores[1]?.category] + vocabulary.size),
        ),
    }))
    .filter((t) => t.strength > 0)
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 6)
    .map((t) => t.token);
  return {
    category: scores[0]?.category ?? "Other",
    scores: scores.slice(0, 3),
    coverage,
    abstained: known.length < 2 || coverage < 0.15 || margin < 0.15,
    cues,
  };
}
export function evaluateClassifier(model: CivicModel, samples: Sample[]) {
  const test = samples.filter((s) => s.split === "test");
  let correct = 0,
    abstained = 0,
    acceptedCorrect = 0;
  const confusion: Record<string, Record<string, number>> = {};
  for (const label of model.labels)
    confusion[label] = Object.fromEntries(model.labels.map((l) => [l, 0]));
  for (const s of test) {
    const result = predict(model, s.text);
    if (result.category === s.label) correct++;
    if (result.abstained) abstained++;
    else if (result.category === s.label) acceptedCorrect++;
    confusion[s.label][result.category]++;
  }
  const perCategory = model.labels.map((label) => {
    const tp = confusion[label][label],
      fp = model.labels.reduce((sum, l) => sum + (l === label ? 0 : confusion[l][label]), 0),
      fn = model.labels.reduce((sum, l) => sum + (l === label ? 0 : confusion[label][l]), 0);
    return {
      category: label,
      support: tp + fn,
      precision: tp + fp ? tp / (tp + fp) : 0,
      recall: tp + fn ? tp / (tp + fn) : 0,
      f1: 2 * tp + fp + fn ? (2 * tp) / (2 * tp + fp + fn) : 0,
    };
  });
  return {
    testSamples: test.length,
    accuracy: test.length ? correct / test.length : 0,
    macroF1: perCategory.reduce((s, c) => s + c.f1, 0) / Math.max(1, perCategory.length),
    abstentions: abstained,
    coverage: test.length ? (test.length - abstained) / test.length : 0,
    acceptedAccuracy: test.length > abstained ? acceptedCorrect / (test.length - abstained) : null,
    majorityBaseline: test.length
      ? Math.max(...model.labels.map((label) => test.filter((s) => s.label === label).length)) /
        test.length
      : 0,
    perCategory,
    confusion,
  };
}
