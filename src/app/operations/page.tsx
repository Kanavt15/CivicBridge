"use client";
import { Input, Select } from "@/components/localized-fields";
import { Text } from "@/components/i18n";

import { useState } from "react";
import Link from "@/components/localized-fields";
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
              <Text>{"Export filtered queue"}</Text>
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
            <small>
              <Text>{"Queue sample includes demo records"}</Text>
            </small>
          </div>
        ))}
      </div>
      <div className="info-box" style={{ marginBottom: 25 }}>
        <strong>
          <Text>{"A visible policy, not a black box."}</Text>
        </strong>
        <p>
          <Text>
            {
              "Priority = urgency (45) + estimated population reach (25) + waiting time (20) + community support (10). Review targets are internal planning defaults: critical 24h, high 72h, medium 7 days, low 14 days. These are not government response guarantees. Ranking considers up to"
            }
          </Text>
          {d.limit} <Text>{"active reports, selected by urgency and age."}</Text>
        </p>
      </div>
      <div className="operations-layout">
        <section className="dashboard-panel">
          <div className="filter-row" style={{ marginBottom: 20 }}>
            <Input
              aria-label="Filter review queue"
              placeholder="Filter challenges, cities, or categories…"
              value={query}
              maxLength={200}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Select
              aria-label="Filter by urgency"
              value={urgency}
              onChange={(e) => setUrgency(e.target.value)}
            >
              <option value="">
                <Text>{"All urgencies"}</Text>
              </option>
              {["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((value) => (
                <option key={value} value={value}>
                  <Text>{value.toLowerCase()}</Text>
                </option>
              ))}
            </Select>
            <Select
              aria-label="Filter by review status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">
                <Text>{"All review stages"}</Text>
              </option>
              <option value="REPORTED">
                <Text>{"Reported"}</Text>
              </option>
              <option value="UNDER_REVIEW">
                <Text>{"Under review"}</Text>
              </option>
              <option value="OPEN">
                <Text>{"Open"}</Text>
              </option>
            </Select>
            <label className="queue-checkbox">
              <Input
                type="checkbox"
                checked={onlyOverdue}
                onChange={(e) => setOnlyOverdue(e.target.checked)}
              />
              <Text>{"Past target only"}</Text>
            </label>
            <label className="queue-checkbox">
              <Input
                type="checkbox"
                checked={hideDemo}
                onChange={(e) => setHideDemo(e.target.checked)}
              />
              <Text>{"Hide demo reports"}</Text>
            </label>
          </div>
          <p className="muted" role="status">
            <Text>{"Showing"}</Text>
            {items.length} <Text>{" of "}</Text>
            {d.items.length}{" "}
            <Text>{"ranked reports. Export uses these filters and the latest queue."}</Text>
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
                        <Text>{"Past target"}</Text>
                      </span>
                    )}
                  </div>
                  <h3>
                    <Link href={`/problems/${p.id}`}>{p.title}</Link>
                  </h3>
                  <p>
                    {p.city}, {p.state} · {p.population.toLocaleString("en-IN")}{" "}
                    <Text>{" people ·"}</Text>
                    <Text> </Text>
                    {p.priority.ageHours}
                    <Text>{"h waiting"}</Text>
                  </p>
                  <details>
                    <summary>
                      <Text>{"Why this priority?"}</Text>
                    </summary>
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
            {!items.length && (
              <p className="muted">
                <Text>{"No reports match these filters."}</Text>
              </p>
            )}
          </div>
        </section>
        <aside className="side-stack">
          <div className="side-card">
            <h3>
              <Text>{"Where attention is needed"}</Text>
            </h3>
            {d.hotspots.slice(0, 8).map((h: any) => (
              <div className="hotspot-row" key={`${h.city}-${h.state}`}>
                <MapPin size={15} />
                <div>
                  <strong>{h.city}</strong>
                  <small>
                    {h.state} · {h.critical} <Text>{"critical"}</Text>
                  </small>
                </div>
                <span>{h.reports}</span>
              </div>
            ))}
          </div>
          <div className="side-card">
            <h3>
              <Text>{"Platform health and data"}</Text>
            </h3>
            <p>
              <Text>
                {
                  "Check database transactions, release settings, and the bundled model's provenance."
                }
              </Text>
            </p>
            <Button asChild variant="outline">
              <Link href="/system">
                <Text>{"System overview"}</Text>
                <ArrowUpRight size={14} />
              </Link>
            </Button>
          </div>
          <div className="side-card">
            <h3>
              <Text>{"Close the accountability loop"}</Text>
            </h3>
            <p>
              <Text>
                {
                  "Review the outcomes that teams report before they enter the public evidence ledger."
                }
              </Text>
            </p>
            <Button asChild variant="outline">
              <Link href="/admin?tab=evidence">
                <Text>{"Review impact evidence"}</Text>
                <ArrowUpRight size={14} />
              </Link>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
