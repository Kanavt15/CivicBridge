"use client";
import { Text } from "@/components/i18n";

import Link from "@/components/localized-fields";
import { useData } from "@/lib/client";
import { PageIntro, Loading, ErrorState } from "@/components/common";
import { Button } from "@/components/ui/button";

// This page uses the same visual language as the existing operations room.
export default function System() {
  const { data, loading, error, reload } = useData("/api/system");
  if (loading) return <Loading />;
  if (error || !data) return <ErrorState error={error} retry={reload} />;
  const p = data.pipeline;
  return (
    <div className="container page-wrap">
      <PageIntro
        eyebrow="Administrator system overview"
        title="Know what is running."
        description="Check database transactions, release configuration, and the provenance of the bundled civic classifier."
        action={
          <Button variant="outline" onClick={reload}>
            <Text>{"Refresh checks"}</Text>
          </Button>
        }
      />
      <p className="muted">
        <Text>{"Checked"}</Text>
        {new Date(data.checkedAt).toLocaleString()} · {data.environment}
      </p>
      <div className="metric-grid">
        {[
          ["Ready", "Database transactions"],
          [data.pendingEvidence, "Measurements awaiting review"],
          [data.unverifiedOrganizations, "Organizations awaiting verification"],
          [data.configurationIssues.length, "Release configuration issues"],
        ].map(([value, label]) => (
          <div className="metric-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="operations-layout">
        <section className="dashboard-panel">
          <h2>
            <Text>{"Bundled data pipeline"}</Text>
          </h2>
          <p>
            {p.source} <Text>{" · retrieved "}</Text>
            {new Date(p.retrievedAt).toLocaleDateString()}
          </p>
          <p>
            {p.sourceRows.toLocaleString()} <Text>{" aggregate descriptor pairs became "}</Text>
            {p.trainingSamples}
            <Text> </Text>
            <Text>{"training and"}</Text>
            {p.testSamples} <Text>{" held-out examples across "}</Text>
            {p.categories.length} <Text>{"categories."}</Text>
          </p>
          <div className="priority-breakdown">
            {[
              ["Held-out accuracy", p.metrics.accuracy],
              ["Macro F1", p.metrics.macroF1],
              ["Accepted coverage", p.metrics.coverage],
              ["Majority baseline", p.metrics.majorityBaseline],
            ].map(([label, value]) => (
              <span key={label as string}>
                {label}
                <strong>{(Number(value) * 100).toFixed(1)}%</strong>
              </span>
            ))}
          </div>
          <p className="muted">
            <Text>
              {
                "The build validates fingerprints, deterministic training, and evaluation. This bundled report is a release artifact; refreshing this page does not fetch data or retrain the model. NYC descriptors do not establish performance on Indian citizen reports."
              }
            </Text>
          </p>
          <details>
            <summary>
              <Text>{"Dataset and model fingerprints"}</Text>
            </summary>
            {[
              ["Source", p.sourceHash],
              ["Dataset", p.datasetHash],
              ["Model artifact", p.artifactHash],
            ].map(([label, value]) => (
              <p key={label}>
                <strong>{label}</strong>
                <br />
                <code style={{ overflowWrap: "anywhere" }}>{value}</code>
              </p>
            ))}
          </details>
          <Button asChild variant="outline">
            <Link href="/intelligence">
              <Text>{"Inspect the AI lab"}</Text>
            </Link>
          </Button>
        </section>
        <aside className="side-stack">
          <div className="side-card">
            <h3>
              <Text>{"Release configuration"}</Text>
            </h3>
            {data.configurationIssues.length ? (
              <ul>
                {data.configurationIssues.map((issue: string) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            ) : (
              <p>
                <Text>{"Automated configuration checks passed."}</Text>
              </p>
            )}
            <p>
              <Text>{"Demo sign-in: "}</Text>
              <Text>{data.demoSignInEnabled ? "enabled" : "disabled"}</Text>
            </p>
            <p>
              <Text>{"Report assistance: "}</Text>
              {data.assistance}
            </p>
            <p className="muted">
              <Text>
                {
                  "Backups, email recovery, file scanning, and host monitoring need separate operator verification."
                }
              </Text>
            </p>
          </div>
          <div className="side-card">
            <h3>
              <Text>{"Next reviews"}</Text>
            </h3>
            <p>
              <Text>
                {"Review submitted evidence and verify organizations before extending access."}
              </Text>
            </p>
            <Button asChild variant="outline">
              <Link href="/admin">
                <Text>{"Open administration"}</Text>
              </Link>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
