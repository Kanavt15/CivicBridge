"use client";
import { use, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { MapPin, Calendar, ThumbsUp, Lightbulb, User, ArrowUpRight, Send } from "lucide-react";
import { toast } from "sonner";
import { api, useData } from "@/lib/client";
import { impactScore } from "@/lib/domain";
import { date, initials, label } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Breadcrumbs,
  Status,
  Badge,
  DemoBadge,
  Loading,
  ErrorState,
  Timeline,
  Empty,
} from "@/components/common";
import { MapView } from "@/components/map";
import { StatusControl } from "@/components/status-control";
export default function Problem({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: p, error, loading, reload } = useData(`problems/${id}`);
  const { data: session } = useSession();
  const [comment, setComment] = useState(""),
    [busy, setBusy] = useState(false);
  async function vote() {
    setBusy(true);
    try {
      await api(`problems/${id}/vote`, "POST");
      await reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function post(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api(`problems/${id}/comments`, "POST", { body: comment });
      setComment("");
      toast.success("Feedback added.");
      await reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function withdraw() {
    setBusy(true);
    try {
      await api(`problems/${id}`, "DELETE");
      toast.success("Report withdrawn.");
      await reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (loading) return <Loading />;
  if (error || !p) return <ErrorState error={error} retry={reload} />;
  const score = impactScore(
    p,
    p.proposals.some((s: any) => ["APPROVED", "PILOT", "COMPLETED"].includes(s.status)) ? 15 : 0,
  );
  return (
    <div className="container page-wrap">
      <Breadcrumbs items={[{ label: "Challenges", href: "/explore" }, { label: p.title }]} />
      <div className="detail-header">
        <div className="detail-badges">
          <Badge>{p.category}</Badge>
          <Status value={p.status} />
          <Badge type={p.urgency === "CRITICAL" ? "rejected" : "pending"}>
            {label(p.urgency)} urgency
          </Badge>
          {p.isDemo && <DemoBadge />}
        </div>
        <h1>{p.title}</h1>
        <div className="detail-byline">
          <span>
            <MapPin size={14} />
            {p.area}, {p.city}, {p.state}
          </span>
          <span>
            <Calendar size={14} />
            {date(p.createdAt)}
          </span>
          <span>
            <User size={14} />
            <Link href={`/people/${p.author.id}`}>{p.author.name}</Link>
          </span>
        </div>
      </div>
      <div className="two-col">
        <div>
          <article className="detail-content">
            {p.images.length > 0 && (
              <div className="detail-images">
                {p.images.map((i: any) => (
                  <a href={`/api/files/${i.id}`} key={i.id} target="_blank" rel="noreferrer">
                    <img src={`/api/files/${i.id}`} alt={i.name} />
                  </a>
                ))}
              </div>
            )}
            <h2>The challenge</h2>
            <p>{p.description}</p>
            <div className="detail-section">
              <h2>Where it’s happening</h2>
              <MapView value={[p.latitude, p.longitude]} />
            </div>
            <div className="detail-section">
              <h2>
                Ideas taking shape <span className="muted">({p.proposals.length})</span>
              </h2>
              {p.proposals.length ? (
                p.proposals.map((s: any) => (
                  <Link className="proposal-row" href={`/innovations/${s.id}`} key={s.id}>
                    <div>
                      <h3>{s.title}</h3>
                      <p>
                        {s.author.name} {s.team && `· ${s.team.name}`}
                      </p>
                      <Status value={s.status} />
                    </div>
                    <ArrowUpRight size={18} />
                  </Link>
                ))
              ) : (
                <p className="muted">
                  No public proposals yet. Bring the first idea to this challenge.
                </p>
              )}
            </div>
            <div className="detail-section">
              <h2>Community conversation</h2>
              <div className="comment-list">
                {p.comments.map((c: any) => (
                  <div className="comment" key={c.id}>
                    <div className="avatar">{initials(c.author.name)}</div>
                    <div>
                      <strong>{c.author.name}</strong>
                      <small>{date(c.createdAt)}</small>
                      <p>{c.body}</p>
                    </div>
                  </div>
                ))}
              </div>
              {session ? (
                <form className="compact-form" onSubmit={post}>
                  <textarea
                    aria-label="Your feedback"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    minLength={3}
                    maxLength={3000}
                    required
                    placeholder="Add your perspective or ask a thoughtful question…"
                  />
                  <Button type="submit" disabled={busy}>
                    <Send size={15} />
                    Post feedback
                  </Button>
                </form>
              ) : (
                <Link className="text-link" href="/login">
                  Sign in to join the conversation <ArrowUpRight size={15} />
                </Link>
              )}
            </div>
          </article>
        </div>
        <aside className="side-stack">
          <div className="side-card">
            <h3>Be part of the solution.</h3>
            <p>Have an idea that could help? Turn your expertise into an actionable proposal.</p>
            {p.status === "OPEN" && (
              <Button asChild>
                <Link
                  href={
                    session && ["RESEARCHER", "INSTITUTION", "ADMIN"].includes(session.user.role)
                      ? `/solutions/new?problem=${id}`
                      : "/login"
                  }
                >
                  <Lightbulb size={16} />
                  Propose a solution
                </Link>
              </Button>
            )}
            <Button variant={p.voted ? "secondary" : "outline"} disabled={busy} onClick={vote}>
              <ThumbsUp size={15} />
              {p.voted ? "Supported" : "Support this challenge"} ({p._count.votes})
            </Button>
            <div className="side-row">
              <span>People affected</span>
              <strong>{p.population.toLocaleString("en-IN")}</strong>
            </div>
            <div className="side-row">
              <span>Reference</span>
              <small title={p.id}>{p.id.slice(-16)}</small>
            </div>
          </div>
          <div className="side-card">
            <h3>Estimated impact potential</h3>
            <div className="score-number">
              {score.total}
              <small> / 100</small>
            </div>
            <div className="progress-bar">
              <span style={{ width: `${score.total}%` }} />
            </div>
            <p>A transparent estimate, not a measured outcome.</p>
            {[
              ["Urgency", score.urgency, 30],
              ["People affected", score.population, 25],
              ["Implementation progress", score.progress, 30],
              ["Approved solution readiness", score.readiness, 15],
            ].map(([name, v, max]) => (
              <div className="side-row" key={name}>
                <span>{name}</span>
                <strong>
                  {v}/{max}
                </strong>
              </div>
            ))}
            <small className="muted">
              Population is logarithmically scaled. Readiness is awarded when a solution is
              approved.
            </small>
          </div>
          <div className="side-card">
            <h3>The journey so far</h3>
            <Timeline items={p.timeline} />
          </div>
          {session?.user.role === "ADMIN" && (
            <div className="side-card">
              <h3>Review this report</h3>
              <StatusControl type="problems" id={id} status={p.status} onUpdate={reload} />
            </div>
          )}
          {session?.user.id === p.authorId && p.status === "REPORTED" && (
            <div className="side-card">
              <h3>Manage your report</h3>
              <p>You may withdraw this report while it awaits review.</p>
              <Button variant="outline" disabled={busy} onClick={withdraw}>
                Withdraw report
              </Button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
