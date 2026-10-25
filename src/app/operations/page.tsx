"use client";
import { useState } from "react";
import Link from "next/link";
import { Download, ArrowUpRight, Clock, MapPin } from "lucide-react";
import { useData } from "@/lib/client";
import { PageIntro, Loading, ErrorState, Status, DemoBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { filterQueue } from "@/lib/operations";
export default function Operations() {
  const { data: d, error, loading, reload } = useData("/api/operations");
  const [query, setQuery] = useState(""),
    [onlyOverdue, setOnlyOverdue] = useState(false),
    [urgency, setUrgency] = useState(""),
    [status, setStatus] = useState(""),
    [hideDemo, setHideDemo] = useState(false);
  if (loading) return <Loading />;
  if (error || !d) return <ErrorState error={error} retry={reload} />;
  const items = filterQueue<any>(d.items, {
    query,
    overdue: onlyOverdue,
    urgency,
    status,
    hideDemo,
  });
  const exportQuery = new URLSearchParams({
    format: "csv",
    q: query.trim(),
    overdue: String(onlyOverdue),
    urgency,
    status,
    hideDemo: String(hideDemo),
  });
  return (
    <div className="container page-wrap">
      <PageIntro
        eyebrow="Administrator operations room"
        title="Make the next decision count."
        description="An explainable review queue that combines urgency, community reach, time waiting, and support. Every decision stays with a human reviewer."
        action={
          <Button asChild variant="outline">
            <a href={`/api/operations?${exportQuery}`}>
              <Download size={15} />
              Export filtered queue
            </a>
          </Button>
        }
      />
      <div className="metric-grid">
        {[
          [d.total, "Active reports"],
          [d.items.length, "Reports ranked"],
          [d.overdue, "Past review target"],
          [d.withoutSolutions, "Without a proposal"],
        ].map(([value, title]) => (
          <div className="metric-card" key={title}>
            <span>{title}</span>
            <strong>{value}</strong>
            <small>Queue sample includes demo records</small>
          </div>
        ))}
      </div>
      <div className="info-box" style={{ marginBottom: 25 }}>
        <strong>A visible policy, not a black box.</strong>
        <p>
          Priority = urgency (45) + estimated population reach (25) + waiting time (20) + community
          support (10). Review targets are internal planning defaults: critical 24h, high 72h,
          medium 7 days, low 14 days. These are not government response guarantees. Ranking
          considers up to {d.limit} active reports, selected by urgency and age.
        </p>
      </div>
      <div className="operations-layout">
        <section className="dashboard-panel">
          <div className="filter-row" style={{ marginBottom: 20 }}>
            <input
              aria-label="Filter review queue"
              placeholder="Filter challenges, cities, or categories…"
              value={query}
              maxLength={200}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select
              aria-label="Filter by urgency"
              value={urgency}
              onChange={(e) => setUrgency(e.target.value)}
            >
              <option value="">All urgencies</option>
              {["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((value) => (
                <option key={value} value={value}>
                  {value.toLowerCase()}
                </option>
              ))}
            </select>
            <select
              aria-label="Filter by review status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All review stages</option>
              <option value="REPORTED">Reported</option>
              <option value="UNDER_REVIEW">Under review</option>
              <option value="OPEN">Open</option>
            </select>
            <label className="queue-checkbox">
              <input
                type="checkbox"
                checked={onlyOverdue}
                onChange={(e) => setOnlyOverdue(e.target.checked)}
              />
              Past target only
            </label>
            <label className="queue-checkbox">
              <input
                type="checkbox"
                checked={hideDemo}
                onChange={(e) => setHideDemo(e.target.checked)}
              />
              Hide demo reports
            </label>
          </div>
          <p className="muted" role="status">
            Showing {items.length} of {d.items.length} ranked reports. Export uses these filters and
            the latest queue.
          </p>
          <div className="review-queue">
            {items.map((p: any) => (
              <article className="queue-item" key={p.id}>
                <div className="queue-score">
                  <strong>{p.priority.score}</strong>
                  <small>/ 100</small>
                </div>
                <div className="queue-body">
                  <div className="detail-badges">
                    <Status value={p.status} />
                    {p.isDemo && <DemoBadge />}
                    {p.priority.overdue && (
                      <span className="queue-overdue">
                        <Clock size={11} />
                        Past target
                      </span>
                    )}
                  </div>
                  <h3>
                    <Link href={`/problems/${p.id}`}>{p.title}</Link>
                  </h3>
                  <p>
                    {p.city}, {p.state} · {p.population.toLocaleString("en-IN")} people ·{" "}
                    {p.priority.ageHours}h waiting
                  </p>
                  <details>
                    <summary>Why this priority?</summary>
                    <div className="priority-breakdown">
                      {Object.entries(p.priority.parts).map(([key, value]: any) => (
                        <span key={key}>
                          {key}
                          <strong>{value}</strong>
                        </span>
                      ))}
                    </div>
                  </details>
                </div>
                <Link
                  className="icon-btn"
                  href={`/problems/${p.id}`}
                  aria-label={`Review ${p.title}`}
                >
                  <ArrowUpRight size={18} />
                </Link>
              </article>
            ))}
            {!items.length && <p className="muted">No reports match these filters.</p>}
          </div>
        </section>
        <aside className="side-stack">
          <div className="side-card">
            <h3>Where attention is needed</h3>
            {d.hotspots.slice(0, 8).map((h: any) => (
              <div className="hotspot-row" key={`${h.city}-${h.state}`}>
                <MapPin size={15} />
                <div>
                  <strong>{h.city}</strong>
                  <small>
                    {h.state} · {h.critical} critical
                  </small>
                </div>
                <span>{h.reports}</span>
              </div>
            ))}
          </div>
          <div className="side-card">
            <h3>Platform health and data</h3>
            <p>
              Check database transactions, release settings, and the bundled model's provenance.
            </p>
            <Button asChild variant="outline">
              <Link href="/system">
                System overview <ArrowUpRight size={14} />
              </Link>
            </Button>
          </div>
          <div className="side-card">
            <h3>Close the accountability loop</h3>
            <p>
              Review the outcomes that teams report before they enter the public evidence ledger.
            </p>
            <Button asChild variant="outline">
              <Link href="/admin?tab=evidence">
                Review impact evidence <ArrowUpRight size={14} />
              </Link>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
