import artifact from "./generated/model.json";
import { predict, type CivicModel } from "./naive-bayes";
import { suggest } from "../domain";
export function localAssistance(text: string) {
  const fallback = suggest(text);
  if (
    process.env.AI_CLASSIFIER_MODE !== "local-model" ||
    (artifact.card.provenance === "synthetic-demo" && process.env.ALLOW_DEMO_MODEL !== "true")
  )
    return fallback;
  if (fallback.category !== "Other" && !artifact.model.labels.includes(fallback.category))
    return { ...fallback, source: "Rule-based suggestion · category outside model coverage" };
  const result = predict(artifact.model as CivicModel, text);
  if (result.abstained)
    return {
      ...fallback,
      source: "Rule-based suggestion · local model abstained",
      explanation:
        "The local classifier found insufficient evidence. Review the rule-based category and urgency.",
    };
  return {
    ...fallback,
    category: result.category,
    source: `Local classifier · ${artifact.card.provenance} · review required`,
    explanation: `Category cues: ${result.cues.join(", ") || "shared vocabulary"}. Urgency remains a keyword-based suggestion. This model is not validated on real citizen reports.`,
  };
}
