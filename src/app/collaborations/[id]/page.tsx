"use client";
import { use, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Send, Plus, Lock, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { api, useData } from "@/lib/client";
import { date, initials, label } from "@/lib/utils";
import { Breadcrumbs, PageIntro, Loading, ErrorState, Status } from "@/components/common";
import { Button } from "@/components/ui/button";
import { WorkspaceEvidence } from "@/components/evidence";
export default function Workspace({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: c, error, loading, reload } = useData(`collaborations/${id}`);
  const { data: session } = useSession();
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function mutate(path: string, method: string, input: any) {
    setBusy(true);
    try {
      await api(`collaborations/${id}/${path}`, method, input);
      await reload();
      toast.success("Workspace updated.");
      return true;
    } catch (e) {
      toast.error((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  if (loading) return <Loading />;
  if (error || !c) return <ErrorState error={error} retry={reload} />;
  const lead =
    session?.user.role === "ADMIN" ||
    session?.user.id === c.proposal.authorId ||
    c.proposal.team?.members.some(
      (m: any) => m.userId === session?.user.id && m.role === "LEAD" && m.accepted,
    );
  const teamMember =
    lead || c.proposal.team?.members.some((m: any) => m.userId === session?.user.id && m.accepted);
  const done = c.milestones.filter((m: any) => m.completedAt).length;
  return (
    <div className="container page-wrap">
      <Breadcrumbs
        items={[{ label: "Collaborations", href: "/collaborations" }, { label: c.proposal.title }]}
      />
      <PageIntro
        eyebrow="Private collaboration workspace"
        title={c.proposal.title}
        description={c.proposal.problem.title}
        action={<Status value={c.proposal.status} />}
      />
      <div
        className="info-box"
        style={{ marginBottom: 25, display: "flex", gap: 10, alignItems: "center" }}
      >
        <Lock size={16} />
        <span>
          Only the approved team, accepted support partners, and administrators can access this
          workspace.
        </span>
      </div>
      <WorkspaceEvidence collaborationId={id} canSubmit={!!teamMember} />
      <div className="workspace-grid">
        <div>
          <section className="dashboard-panel">
            <div className="panel-heading">
              <h2>Project milestones</h2>
              <span className="muted">
                {done} / {c.milestones.length}
              </span>
            </div>
            <div className="progress-bar">
              <span
                style={{
                  width: `${c.milestones.length ? (done / c.milestones.length) * 100 : 0}%`,
                }}
              />
            </div>
            {c.milestones.map((m: any) => (
              <div className={`check-row ${m.completedAt ? "done" : ""}`} key={m.id}>
                <input
                  type="checkbox"
                  checked={!!m.completedAt}
                  disabled={!lead || busy || !!m.verifiedAt}
                  aria-label={`Complete milestone: ${m.title}`}
                  onChange={(e) =>
                    mutate("milestones", "PATCH", { milestoneId: m.id, done: e.target.checked })
                  }
                />
                <div>
                  <strong>{m.title}</strong>
                  <small>
                    Due {date(m.dueDate)}
                    {m.completedAt ? ` · Completed ${date(m.completedAt)}` : ""}
                  </small>
                  {m.description && <p style={{ fontSize: 11, marginTop: 5 }}>{m.description}</p>}
                  {m.verifiedAt && (
                    <small style={{ color: "var(--teal)" }}>Verified achievement · 20 points</small>
                  )}
                  {m.completedAt && !m.verifiedAt && session?.user.role === "ADMIN" && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onClick={() =>
                        mutate("milestones", "PATCH", {
                          milestoneId: m.id,
                          done: true,
                          verify: true,
                        })
                      }
                    >
                      Verify achievement
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {!c.milestones.length && (
              <p className="muted">
                Define your first milestone to give the project a clear direction.
              </p>
            )}
            {lead && (
              <form
                className="form-stack space-top"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const data = Object.fromEntries(new FormData(form));
                  if (await mutate("milestones", "POST", data)) form.reset();
                }}
              >
                <label className="field">
                  Milestone title
                  <input
                    name="title"
                    required
                    minLength={3}
                    maxLength={160}
                    placeholder="What will you achieve?"
                  />
                </label>
                <div className="form-grid">
                  <label className="field">
                    Target date
                    <input type="date" name="dueDate" required />
                  </label>
                  <label className="field">
                    Description (optional)
                    <input
                      name="description"
                      maxLength={2000}
                      placeholder="A clear, measurable outcome"
                    />
                  </label>
                </div>
                <Button type="submit" variant="outline" disabled={busy}>
                  <Plus size={15} />
                  Add milestone
                </Button>
              </form>
            )}
          </section>
          <section className="dashboard-panel">
            <div className="panel-heading">
              <h2>Team tasks</h2>
            </div>
            {c.tasks.map((t: any) => (
              <label className={`check-row ${t.done ? "done" : ""}`} key={t.id}>
                <input
                  type="checkbox"
                  checked={t.done}
                  disabled={
                    busy || (session?.user.id !== t.assigneeId && session?.user.role !== "ADMIN")
                  }
                  onChange={(e) =>
                    mutate("tasks", "PATCH", { taskId: t.id, done: e.target.checked })
                  }
                />
                <div>
                  <strong>{t.title}</strong>
                  <small>{t.assignee.name}</small>
                </div>
              </label>
            ))}
            {!c.tasks.length && (
              <p className="muted">Break the next milestone into manageable tasks.</p>
            )}
            {teamMember && (
              <form
                className="compact-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const f = e.currentTarget;
                  const title = new FormData(f).get("title");
                  if (await mutate("tasks", "POST", { title })) f.reset();
                }}
              >
                <input
                  name="title"
                  minLength={3}
                  maxLength={200}
                  required
                  placeholder="Add a task for yourself"
                  aria-label="New task title"
                />
                <Button variant="outline" type="submit" disabled={busy}>
                  <Plus size={15} />
                  Add task
                </Button>
              </form>
            )}
          </section>
          <section className="dashboard-panel">
            <div className="panel-heading">
              <h2>Progress & discussion</h2>
            </div>
            <div className="comment-list">
              {c.discussions.map((m: any) => (
                <div className="comment" key={m.id}>
                  <span className="avatar">{initials(m.author.name)}</span>
                  <div>
                    <strong>{m.author.name}</strong>
                    <small>{date(m.createdAt)}</small>
                    <p>{m.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <form
              className="compact-form"
              onSubmit={async (e) => {
                e.preventDefault();
                if (await mutate("discussion", "POST", { body: message })) setMessage("");
              }}
            >
              <textarea
                aria-label="Workspace message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                minLength={3}
                maxLength={3000}
                placeholder="Share a progress update, ask a question, or request a resource…"
              />
              <Button type="submit" disabled={busy}>
                <Send size={15} />
                Post update
              </Button>
            </form>
          </section>
        </div>
        <div>
          <section className="dashboard-panel">
            <div className="panel-heading">
              <h2>People behind the project</h2>
            </div>
            <div className="member-row">
              <span className="avatar">{initials(c.proposal.author.name)}</span>
              <Link href={`/people/${c.proposal.author.id}`}>{c.proposal.author.name}</Link>
              <small>Project lead</small>
            </div>
            {c.proposal.team?.members
              .filter((m: any) => m.userId !== c.proposal.authorId)
              .map((m: any) => (
                <div className="member-row" key={m.id}>
                  <span className="avatar">{initials(m.user.name)}</span>
                  <Link href={`/people/${m.user.id}`}>{m.user.name}</Link>
                  <small>Team member</small>
                </div>
              ))}
            <Link className="text-link space-top" href={`/innovations/${c.proposalId}`}>
              View innovation proposal
              <ArrowUpRight size={14} />
            </Link>
          </section>
          <section className="dashboard-panel">
            <div className="panel-heading">
              <h2>Resources & support</h2>
            </div>
            <p className="prose-text" style={{ fontSize: 12 }}>
              {c.proposal.resources}
            </p>
            <div className="space-top">
              {c.commitments.map((s: any) => (
                <div className="support-row" key={s.id}>
                  <div>
                    <strong>{s.user.name}</strong>
                    <Status value={s.status} />
                  </div>
                  <small className="muted">
                    {label(s.type)} · {s.user.organization?.name || "Independent partner"}
                  </small>
                  <p>{s.description}</p>
                  {lead && s.status === "PENDING" && (
                    <div>
                      <Button
                        size="sm"
                        disabled={busy}
                        onClick={() =>
                          mutate("support", "PATCH", { commitmentId: s.id, status: "ACCEPTED" })
                        }
                      >
                        Accept partner
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() =>
                          mutate("support", "PATCH", { commitmentId: s.id, status: "DECLINED" })
                        }
                      >
                        Decline
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {!c.commitments.length && (
              <p className="muted" style={{ fontSize: 12, marginTop: 15 }}>
                Partner requests will appear here. Industry and institution accounts can offer
                support from the innovation’s public page.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
