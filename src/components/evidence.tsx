"use client";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowUpRight, ClipboardCheck, Plus, ShieldCheck } from "lucide-react";
import { api, useData } from "@/lib/client";
import { impactMetrics, measuredChange, type ImpactMetric } from "@/lib/impact-evidence";
import { date } from "@/lib/utils";
import { Button } from "./ui/button";
import { Badge, DemoBadge, Loading, ErrorState, Empty } from "./common";
export function MeasurementCard({
  item: m,
  review = false,
  onReviewed,
}: {
  item: any;
  review?: boolean;
  onReviewed?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const metric = impactMetrics[m.metric as ImpactMetric],
    change = measuredChange(m.metric, m.baseline, m.observed);
  const p = m.collaboration.proposal;
  async function decide(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await api("/api/evidence", "PATCH", {
        id: m.id,
        status: f.get("status"),
        reviewNote: f.get("reviewNote"),
      });
      toast.success("Evidence review recorded and contributor notified.");
      onReviewed?.();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="measurement-card">
      <div className="detail-badges">
        <Badge
          type={
            m.status === "VERIFIED" ? "approved" : m.status === "REJECTED" ? "rejected" : "pending"
          }
        >
          {m.status === "VERIFIED" ? <ShieldCheck size={12} /> : <ClipboardCheck size={12} />}{" "}
          {m.status.toLowerCase()}
        </Badge>
        {p.isDemo && <DemoBadge />}
        <small className="muted">
          {p.problem.city} · {p.problem.category}
        </small>
      </div>
      <h3>{metric.name}</h3>
      <p className="measurement-project">
        <Link href={`/innovations/${p.id}`}>
          {p.title}
          <ArrowUpRight size={13} />
        </Link>
      </p>
      <div className="measurement-values">
        <div>
          <small>Baseline</small>
          <strong>{m.baseline.toLocaleString("en-IN")}</strong>
        </div>
        <span>→</span>
        <div>
          <small>Observed</small>
          <strong>{m.observed.toLocaleString("en-IN")}</strong>
        </div>
        <div className={`evidence-change ${change.delta < 0 ? "decline" : ""}`}>
          <strong>
            {change.delta > 0 ? "+" : ""}
            {change.delta.toLocaleString("en-IN")}
          </strong>
          <small>{change.unit} improvement</small>
        </div>
      </div>
      <p className="measurement-context">
        {date(m.periodStart)} – {date(m.periodEnd)} · sample size{" "}
        {m.sampleSize.toLocaleString("en-IN")}
        {change.percent !== null
          ? ` · ${change.percent}% change`
          : " · percentage unavailable for zero baseline"}
      </p>
      <details className="evidence-details">
        <summary>Method and supporting evidence</summary>
        <p>{m.methodology}</p>
        <a className="text-link" href={m.evidenceUrl} target="_blank" rel="noopener noreferrer">
          Open supporting evidence <ArrowUpRight size={13} />
        </a>
        <small>Evidence is supplied by the team; external links open on their host.</small>
      </details>
      {m.reviewedAt && (
        <div className="review-note">
          <strong>Administrator review · {date(m.reviewedAt)}</strong>
          <p>{m.reviewNote}</p>
        </div>
      )}
      {review && m.status === "PENDING" && (
        <form className="form-stack space-top" onSubmit={decide}>
          <label className="field">
            Review decision
            <select name="status">
              <option value="VERIFIED">Verify and publish evidence</option>
              <option value="REJECTED">Reject evidence</option>
            </select>
          </label>
          <label className="field">
            Reason for this decision
            <textarea
              name="reviewNote"
              minLength={10}
              maxLength={2000}
              required
              placeholder="Describe which evidence and measurement method you reviewed."
            />
          </label>
          <Button type="submit" disabled={busy}>
            {busy ? "Recording…" : "Record review"}
          </Button>
        </form>
      )}
    </article>
  );
}
export function WorkspaceEvidence({
  collaborationId,
  canSubmit,
}: {
  collaborationId: string;
  canSubmit: boolean;
}) {
  const { data, error, loading, reload } = useData(
    `/api/evidence?collaborationId=${encodeURIComponent(collaborationId)}`,
  );
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [errorText, setErrorText] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setErrorText("");
    try {
      await api("/api/evidence", "POST", {
        ...Object.fromEntries(f),
        collaborationId,
        baseline: Number(f.get("baseline")),
        observed: Number(f.get("observed")),
        sampleSize: Number(f.get("sampleSize")),
      });
      toast.success("Measurement submitted for independent administrator review.");
      setOpen(false);
      await reload();
    } catch (e) {
      setErrorText((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="dashboard-panel space-top">
      <div className="panel-heading">
        <div>
          <h2>Prove the difference.</h2>
          <p style={{ fontSize: 12, marginTop: 7 }}>
            Record comparable before-and-after measurements. Approved evidence appears in the public
            impact ledger.
          </p>
        </div>
        {canSubmit && (
          <Button variant="outline" size="sm" onClick={() => setOpen(!open)}>
            <Plus size={14} />
            {open ? "Close form" : "Record an outcome"}
          </Button>
        )}
      </div>
      {open && (
        <form className="form-stack evidence-form" onSubmit={submit}>
          {errorText && (
            <div className="form-message" role="alert">
              {errorText}
            </div>
          )}
          <div className="form-grid">
            <label className="field full">
              Outcome metric
              <select name="metric">
                {Object.entries(impactMetrics).map(([key, m]) => (
                  <option key={key} value={key}>
                    {m.name} ({m.unit})
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Baseline value
              <input type="number" step="any" min={0} max={1e12} name="baseline" required />
            </label>
            <label className="field">
              Observed value
              <input type="number" step="any" min={0} max={1e12} name="observed" required />
            </label>
            <label className="field">
              Measurement period start
              <input type="date" name="periodStart" required />
            </label>
            <label className="field">
              Measurement period end
              <input
                type="date"
                name="periodEnd"
                required
                max={new Date().toISOString().slice(0, 10)}
              />
            </label>
            <label className="field">
              Sample size
              <input type="number" min={1} max={100000000} name="sampleSize" required />
            </label>
            <label className="field">
              Public supporting evidence URL
              <input
                type="url"
                name="evidenceUrl"
                required
                placeholder="https://…"
                maxLength={2048}
              />
            </label>
            <label className="field full">
              How did you measure it?
              <textarea
                name="methodology"
                minLength={40}
                maxLength={5000}
                required
                placeholder="Explain the baseline period, sample, comparable time windows, collection method, and limitations. Keep personal details out of public evidence."
              />
              <small>
                Baseline and observed values must use comparable time windows and populations. An
                administrator reviews the claim before publication.
              </small>
            </label>
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? "Submitting…" : "Submit measurement for review"}
          </Button>
        </form>
      )}
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} retry={reload} />
      ) : !data?.length ? (
        <p className="muted">
          No outcomes recorded yet. Start with a baseline and a repeatable measurement method.
        </p>
      ) : (
        <div className="measurement-grid">
          {data.map((m: any) => (
            <MeasurementCard item={m} key={m.id} />
          ))}
        </div>
      )}
    </section>
  );
}
export function EvidenceReview() {
  const { data, error, loading, reload } = useData("/api/evidence?scope=review");
  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} retry={reload} />;
  return (
    <>
      {!data?.length ? (
        <Empty
          title="Evidence begins in the field"
          description="Measurements submitted from collaboration workspaces appear here for administrator review."
        />
      ) : (
        <div className="measurement-grid">
          {[...data]
            .sort((a, b) => Number(b.status === "PENDING") - Number(a.status === "PENDING"))
            .map((m: any) => (
              <MeasurementCard key={m.id} item={m} review onReviewed={reload} />
            ))}
        </div>
      )}
    </>
  );
}
