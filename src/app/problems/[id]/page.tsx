"use client";
import { LocalDate } from "@/components/i18n";

import { Textarea } from "@/components/localized-fields";
import { Text } from "@/components/i18n";

import { use, useState } from "react";
import Link from "@/components/localized-fields";
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
          <Badge>
            <Text>{p.category}</Text>
          </Badge>
          <Status value={p.status} />
          <Badge type={p.urgency === "CRITICAL" ? "rejected" : "pending"}>
            <Text>{label(p.urgency)}</Text> <Text>{"urgency"}</Text>
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
            <LocalDate value={p.createdAt} />
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
            <h2>
              <Text>{"The challenge"}</Text>
            </h2>
            <p>{p.description}</p>
            <div className="detail-section">
              <h2>
                <Text>{"Where it’s happening"}</Text>
              </h2>
              <MapView value={[p.latitude, p.longitude]} />
            </div>
            <div className="detail-section">
              <h2>
                <Text>{"Ideas taking shape"}</Text>
                <span className="muted">({p.proposals.length})</span>
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
                  <Text>{"No public proposals yet. Bring the first idea to this challenge."}</Text>
                </p>
              )}
            </div>
            <div className="detail-section">
              <h2>
                <Text>{"Community conversation"}</Text>
              </h2>
              <div className="comment-list">
                {p.comments.map((c: any) => (
                  <div className="comment" key={c.id}>
                    <div className="avatar">{initials(c.author.name)}</div>
                    <div>
                      <strong>{c.author.name}</strong>
                      <small>
                        <LocalDate value={c.createdAt} />
                      </small>
                      <p>{c.body}</p>
                    </div>
                  </div>
                ))}
              </div>
              {session ? (
                <form className="compact-form" onSubmit={post}>
                  <Textarea
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
                    <Text>{"Post feedback"}</Text>
                  </Button>
                </form>
              ) : (
                <Link className="text-link" href="/login">
                  <Text>{"Sign in to join the conversation"}</Text>
                  <ArrowUpRight size={15} />
                </Link>
              )}
            </div>
          </article>
        </div>
        <aside className="side-stack">
          <div className="side-card">
            <h3>
              <Text>{"Be part of the solution."}</Text>
            </h3>
            <p>
              <Text>
                {"Have an idea that could help? Turn your expertise into an actionable proposal."}
              </Text>
            </p>
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
                  <Text>{"Propose a solution"}</Text>
                </Link>
              </Button>
            )}
            <Button variant={p.voted ? "secondary" : "outline"} disabled={busy} onClick={vote}>
              <ThumbsUp size={15} />
              <Text>{p.voted ? "Supported" : "Support this challenge"}</Text> ({p._count.votes})
            </Button>
            <div className="side-row">
              <span>
                <Text>{"People affected"}</Text>
              </span>
              <strong>{p.population.toLocaleString("en-IN")}</strong>
            </div>
            <div className="side-row">
              <span>
                <Text>{"Reference"}</Text>
              </span>
              <small title={p.id}>{p.id.slice(-16)}</small>
            </div>
          </div>
          <div className="side-card">
            <h3>
              <Text>{"Estimated impact potential"}</Text>
            </h3>
            <div className="score-number">
              {score.total}
              <small> / 100</small>
            </div>
            <div className="progress-bar">
              <span style={{ width: `${score.total}%` }} />
            </div>
            <p>
              <Text>{"A transparent estimate, not a measured outcome."}</Text>
            </p>
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
              <Text>
                {
                  "Population is logarithmically scaled. Readiness is awarded when a solution is approved."
                }
              </Text>
            </small>
          </div>
          <div className="side-card">
            <h3>
              <Text>{"The journey so far"}</Text>
            </h3>
            <Timeline items={p.timeline} />
          </div>
          {session?.user.role === "ADMIN" && (
            <div className="side-card">
              <h3>
                <Text>{"Review this report"}</Text>
              </h3>
              <StatusControl type="problems" id={id} status={p.status} onUpdate={reload} />
            </div>
          )}
          {session?.user.id === p.authorId && p.status === "REPORTED" && (
            <div className="side-card">
              <h3>
                <Text>{"Manage your report"}</Text>
              </h3>
              <p>
                <Text>{"You may withdraw this report while it awaits review."}</Text>
              </p>
              <Button variant="outline" disabled={busy} onClick={withdraw}>
                <Text>{"Withdraw report"}</Text>
              </Button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
