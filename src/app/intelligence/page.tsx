"use client";
import { Select, Textarea, Control } from "@/components/localized-fields";
import { Text } from "@/components/i18n";

import { useState } from "react";
import Link from "@/components/localized-fields";
import { FlaskConical, ArrowUpRight, Play, ShieldCheck } from "lucide-react";
import { useSession } from "next-auth/react";
import { api, useData } from "@/lib/client";
import { PageIntro, Loading, ErrorState, Badge } from "@/components/common";
import { Button } from "@/components/ui/button";
export default function Intelligence() {
  const [dataset, setDataset] = useState("public");
  const { data: card, error, loading, reload } = useData(`/api/intelligence?dataset=${dataset}`);
  const { data: session } = useSession();
  const [text, setText] = useState(""),
    [result, setResult] = useState<any>(null),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function run(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      setResult(await api("/api/intelligence", "POST", { text, dataset }));
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (loading) return <Loading />;
  if (error || !card) return <ErrorState error={error} retry={reload} />;
  return (
    <div className="container page-wrap">
      <PageIntro
        eyebrow="Civic intelligence lab"
        title="Useful AI should show its working."
        description="Inspect a real, locally trained text classifier. Compare its suggestions with keyword rules, see which words contributed, and examine the held-out evaluation."
      />
      <label className="field" style={{ maxWidth: 520, marginBottom: 24 }}>
        <Text>{"Dataset and model"}</Text>
        <Select
          value={dataset}
          onChange={(e) => {
            setDataset(e.target.value);
            setResult(null);
          }}
        >
          <option value="public">
            <Text>{"NYC311 · real public municipal descriptors · English"}</Text>
          </option>
          <option value="demo">
            <Text>{"Authored demonstration · synthetic · English + Hindi"}</Text>
          </option>
        </Select>
      </label>
      <div className="evidence-banner">
        <FlaskConical size={27} />
        <div>
          <strong>
            <Text>{"Research demonstrator · "}</Text>
            {card.provenance}
          </strong>
          <p>
            <Text>Research model. Review every suggestion.</Text>
          </p>
          <details className="compact-details">
            <summary>
              <Text>Model details</Text>
            </summary>
            <p>{card.limitations}</p>
            <p>
              <Text>
                {"Your text stays on this server; this lab does not call an external AI service."}
              </Text>
            </p>
          </details>
        </div>
      </div>
      <div className="lab-layout">
        <section className="dashboard-panel">
          <div className="panel-heading">
            <h2>
              <Text>{"Put a report to the test."}</Text>
            </h2>
            <Badge>
              <Text>
                {dataset === "demo" ? "English + हिन्दी demo" : "English municipal baseline"}
              </Text>
            </Badge>
          </div>
          <form className="form-stack" onSubmit={run}>
            <label className="field">
              <Text>{"Describe a community challenge"}</Text>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                minLength={20}
                maxLength={6000}
                required
                rows={5}
                placeholder={
                  dataset === "demo"
                    ? "Explain the issue in English or Hindi…"
                    : "Describe a municipal issue in English…"
                }
              />
            </label>
            <div className="lab-examples">
              <Control
                type="button"
                onClick={() =>
                  setText(
                    "Our village has no reliable drinking water. The borewell is dry and water tankers do not arrive regularly.",
                  )
                }
              >
                <Text>{"Try a water challenge"}</Text>
              </Control>
              <Control
                type="button"
                onClick={() =>
                  setText(
                    dataset === "demo"
                      ? "गांव में स्कूल की कक्षाएं टूटी हुई हैं और बच्चों को पढ़ाई के लिए डिजिटल सामग्री चाहिए।"
                      : "The street lights have broken lamps and damaged electrical wiring along this road.",
                  )
                }
              >
                <Text>{dataset === "demo" ? "हिन्दी उदाहरण" : "Try a street-light challenge"}</Text>
              </Control>
            </div>
            {message && (
              <div className="form-message" role="alert">
                {message}
              </div>
            )}
            {session ? (
              <Button disabled={busy || text.length < 20} type="submit">
                <Play size={15} />
                <Text>{busy ? "Classifying locally…" : "Compare suggestions"}</Text>
              </Button>
            ) : (
              <Button asChild>
                <Link href="/login">
                  <Text>{"Sign in to try the classifier"}</Text>
                  <ArrowUpRight size={15} />
                </Link>
              </Button>
            )}
          </form>
          {result && (
            <div className="lab-result">
              <div className="lab-comparison">
                <div>
                  <small>
                    <Text>{"Trained local model"}</Text>
                  </small>
                  <h3>
                    {result.model.abstained ? "Needs human classification" : result.model.category}
                  </h3>
                  <p>
                    {result.model.abstained
                      ? "The classifier abstained because its vocabulary coverage or separation was too low."
                      : `Matched cues: ${result.model.cues.join(", ") || "shared vocabulary"}`}
                  </p>
                </div>
                <div>
                  <small>
                    <Text>{"Keyword-rule baseline"}</Text>
                  </small>
                  <h3>
                    <Text>{result.rules.category}</Text>
                  </h3>
                  <p>{result.rules.explanation}</p>
                </div>
              </div>
              <h4>
                <Text>{"Relative model scores"}</Text>
              </h4>
              {result.model.scores.map((s: any) => (
                <div className="model-score" key={s.category}>
                  <span>
                    <Text>{s.category}</Text>
                  </span>
                  <div className="progress-bar">
                    <span style={{ width: `${s.score * 100}%` }} />
                  </div>
                  <strong>{Math.round(s.score * 100)}%</strong>
                </div>
              ))}
              <p className="map-hint">
                <Text>
                  {
                    "These are normalized, uncalibrated model scores, not probabilities of a report being correct. Category suggestions never approve a report or determine urgency."
                  }
                </Text>
              </p>
            </div>
          )}
        </section>
        <aside className="side-stack">
          <div className="side-card">
            <h3>
              <Text>{"Model card"}</Text>
            </h3>
            <p>{card.algorithm}</p>
            {[
              ["Training examples", card.trainingSamples],
              ["Held-out examples", card.metrics.testSamples],
              ["Categories", card.labels.length],
              ["Test accuracy", `${(card.metrics.accuracy * 100).toFixed(1)}%`],
              ["Majority-class baseline", `${(card.metrics.majorityBaseline * 100).toFixed(1)}%`],
              ["Macro F1", card.metrics.macroF1.toFixed(3)],
              ["Abstentions", card.metrics.abstentions],
              ["Model coverage", `${(card.metrics.coverage * 100).toFixed(1)}%`],
              [
                "Accuracy when accepted",
                card.metrics.acceptedAccuracy === null
                  ? "No accepted predictions"
                  : `${(card.metrics.acceptedAccuracy * 100).toFixed(1)}%`,
              ],
            ].map(([name, value]) => (
              <div className="side-row" key={name}>
                <span>
                  <Text>{name}</Text>
                </span>
                <strong>{value}</strong>
              </div>
            ))}
            <p className="map-hint">
              <Text>
                {
                  "Accuracy counts the top-ranked label even when the model abstains. Coverage shows how often it offered a suggestion. Neither metric establishes performance on Indian citizen reports."
                }
              </Text>
            </p>
            {card.sourceUrl && (
              <p>
                <a href={card.sourceUrl} target="_blank" rel="noreferrer">
                  <Text>{"View official source ↗"}</Text>
                </a>
                <Text> </Text>·<Text> </Text>
                <a href={card.termsUrl} target="_blank" rel="noreferrer">
                  <Text>{"Reuse terms ↗"}</Text>
                </a>
              </p>
            )}
            {card.unsupportedCategories.length > 0 && (
              <p className="map-hint">
                <Text>{"Outside model coverage:"}</Text>
                {card.unsupportedCategories.join(", ")}
                <Text>{". Rules remain available for these categories."}</Text>
              </p>
            )}
          </div>
          <div className="side-card">
            <h3>
              <ShieldCheck size={16} style={{ display: "inline" }} />{" "}
              <Text>{"What is reviewable?"}</Text>
            </h3>
            <p>
              <Text>
                {
                  "Dataset provenance, separate train/test examples, per-category performance, abstention, and matched vocabulary. No automatic decisions or claims of a production-trained model."
                }
              </Text>
            </p>
            <small className="muted">
              <Text>{"Dataset fingerprint: "}</Text>
              {card.datasetHash.slice(0, 16)}…
            </small>
          </div>
        </aside>
      </div>
      {card.selection && (
        <details className="dashboard-panel space-top">
          <summary>
            <Text>How the model was selected</Text>
          </summary>
          <div className="panel-heading">
            <h2>
              <Text>{"How the model was selected"}</Text>
            </h2>
            <small className="muted">
              <Text>{"Training data only · "}</Text>
              {card.selection.folds} <Text>{" folds"}</Text>
            </small>
          </div>
          <p className="map-hint">
            <Text>
              {
                "Six candidates were compared using stratified cross-validation within the training descriptors. The model with the best mean macro F1 was fitted on all 391 training examples, then evaluated on the separate 112-example test set. These validation scores are distinct from the held-out scores above."
              }
            </Text>
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>
                    <Text>{"Features"}</Text>
                  </th>
                  <th>
                    <Text>{"Classifier"}</Text>
                  </th>
                  <th>
                    <Text>{"Prior"}</Text>
                  </th>
                  <th>
                    <Text>{"Validation accuracy"}</Text>
                  </th>
                  <th>
                    <Text>{"Validation macro F1"}</Text>
                  </th>
                </tr>
              </thead>
              <tbody>
                {card.selection.comparisons.map((m: any) => (
                  <tr key={`${m.config.features}-${m.config.variant}-${m.config.prior}`}>
                    <td>{m.config.features}</td>
                    <td>{m.config.variant}</td>
                    <td>{m.config.prior}</td>
                    <td>{(m.accuracy * 100).toFixed(1)}%</td>
                    <td>{m.macroF1.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
      <details className="dashboard-panel space-top">
        <summary>
          <Text>Held-out performance by category</Text>
        </summary>
        <div className="panel-heading">
          <h2>
            <Text>{"Held-out performance by category"}</Text>
          </h2>
          <small className="muted">
            {card.metrics.testSamples} <Text>{" held-out descriptors/examples · "}</Text>
            {card.license}
          </small>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>
                  <Text>{"Category"}</Text>
                </th>
                <th>
                  <Text>{"Test examples"}</Text>
                </th>
                <th>
                  <Text>{"Precision"}</Text>
                </th>
                <th>
                  <Text>{"Recall"}</Text>
                </th>
                <th>
                  <Text>{"F1"}</Text>
                </th>
              </tr>
            </thead>
            <tbody>
              {card.metrics.perCategory.map((m: any) => (
                <tr key={m.category}>
                  <td>
                    <Text>{m.category}</Text>
                  </td>
                  <td>{m.support}</td>
                  <td>{m.precision.toFixed(2)}</td>
                  <td>{m.recall.toFixed(2)}</td>
                  <td>{m.f1.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="map-hint">
          <Text>
            {
              "For a credible field evaluation, collect consented, de-identified reports labeled by reviewers, keep test cases separate, and evaluate performance by language and region."
            }
          </Text>
        </p>
      </details>
    </div>
  );
}
