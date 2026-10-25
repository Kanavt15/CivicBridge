"use client";
import Link from "next/link";
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
            Refresh checks
          </Button>
        }
      />
      <p className="muted">
        Checked {new Date(data.checkedAt).toLocaleString()} · {data.environment}
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
          <h2>Bundled data pipeline</h2>
          <p>
            {p.source} · retrieved {new Date(p.retrievedAt).toLocaleDateString()}
          </p>
          <p>
            {p.sourceRows.toLocaleString()} aggregate descriptor pairs became {p.trainingSamples}{" "}
            training and {p.testSamples} held-out examples across {p.categories.length} categories.
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
            The build validates fingerprints, deterministic training, and evaluation. This bundled
            report is a release artifact; refreshing this page does not fetch data or retrain the
            model. NYC descriptors do not establish performance on Indian citizen reports.
          </p>
          <details>
            <summary>Dataset and model fingerprints</summary>
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
            <Link href="/intelligence">Inspect the AI lab</Link>
          </Button>
        </section>
        <aside className="side-stack">
          <div className="side-card">
            <h3>Release configuration</h3>
            {data.configurationIssues.length ? (
              <ul>
                {data.configurationIssues.map((issue: string) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            ) : (
              <p>Automated configuration checks passed.</p>
            )}
            <p>Demo sign-in: {data.demoSignInEnabled ? "enabled" : "disabled"}</p>
            <p>Report assistance: {data.assistance}</p>
            <p className="muted">
              Backups, email recovery, file scanning, and host monitoring need separate operator
              verification.
            </p>
          </div>
          <div className="side-card">
            <h3>Next reviews</h3>
            <p>Review submitted evidence and verify organizations before extending access.</p>
            <Button asChild variant="outline">
              <Link href="/admin">Open administration</Link>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
