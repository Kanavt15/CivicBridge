"use client";
import Link from "next/link";
import { ArrowUpRight, Plus, Bell, Lightbulb } from "lucide-react";
import { useData } from "@/lib/client";
import { date } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  PageIntro,
  Loading,
  ErrorState,
  Empty,
  Status,
  ProblemCard,
  DemoBadge,
} from "@/components/common";
import { DashboardNav } from "@/components/dashboard-nav";
import { ImpactCharts } from "@/components/charts";
export default function Dashboard() {
  const { data: d, error, loading, reload } = useData("/api/dashboard");
  if (loading) return <Loading />;
  if (error || !d) return <ErrorState error={error} retry={reload} />;
  const role = d.user.role;
  const metrics =
    role === "CITIZEN"
      ? [
          [d.problems.length, "Your reports"],
          [
            d.problems.filter((p: any) => ["REPORTED", "UNDER_REVIEW"].includes(p.status)).length,
            "Awaiting review",
          ],
          [
            d.problems.filter((p: any) => ["COLLABORATION", "PILOT"].includes(p.status)).length,
            "In collaboration",
          ],
          [d.problems.filter((p: any) => p.status === "RESOLVED").length, "Resolved reports"],
        ]
      : role === "RESEARCHER" || role === "INSTITUTION"
        ? [
            [d.proposals.length, "Proposals submitted"],
            [
              d.proposals.filter((p: any) =>
                ["SUBMITTED", "UNDER_REVIEW", "SHORTLISTED"].includes(p.status),
              ).length,
              "In review",
            ],
            [d.teams, "Innovation teams"],
            [d.proposals.filter((p: any) => p.collaboration).length, "Active projects"],
          ]
        : role === "INDUSTRY"
          ? [
              [d.support.length, "Support requests"],
              [d.support.filter((s: any) => s.status === "PENDING").length, "Awaiting response"],
              [d.support.filter((s: any) => s.status === "ACCEPTED").length, "Supported projects"],
              [d.support.filter((s: any) => s.type === "RESOURCES").length, "Resource commitments"],
            ]
          : [
              [d.stats.contributors, "Registered users"],
              [d.stats.problems, "Public reports"],
              [d.stats.innovations, "Approved innovations"],
              [d.stats.resolved, "Resolved reports"],
            ];
  return (
    <div className="container page-wrap">
      <div className="dashboard-shell">
        <DashboardNav user={d.user} />
        <div>
          <PageIntro
            eyebrow={`${role.toLowerCase()} workspace`}
            title={`Welcome back, ${d.user.name.split(" ")[0]}.`}
            description="A little progress today. A better community tomorrow."
            action={
              <Button asChild>
                <Link
                  href={
                    role === "CITIZEN" ? "/problems/new" : role === "ADMIN" ? "/admin" : "/explore"
                  }
                >
                  {role === "CITIZEN" ? <Plus size={16} /> : <ArrowUpRight size={16} />}{" "}
                  {role === "CITIZEN"
                    ? "Report a problem"
                    : role === "ADMIN"
                      ? "Review submissions"
                      : "Find a challenge"}
                </Link>
              </Button>
            }
          />
          {d.user.isDemo && (
            <div className="info-box" style={{ marginBottom: 20 }}>
              You’re using a seeded demo account. Sample records are labeled “Demo”; new submissions
              are stored as user-created records.
            </div>
          )}
          <div className="metric-grid">
            {metrics.map(([value, title]: any) => (
              <div className="metric-card" key={title}>
                <span>{title}</span>
                <strong>{value}</strong>
                <small>
                  {role === "ADMIN" ? "Platform-wide · includes demos" : "Your workspace"}
                </small>
              </div>
            ))}
          </div>
          {role === "ADMIN" && (
            <div style={{ marginBottom: 25 }}>
              <ImpactCharts stats={d.stats} />
            </div>
          )}
          {role === "CITIZEN" && (
            <div className="dashboard-panel">
              <div className="panel-heading">
                <h2>Your reported challenges</h2>
                <Link href="/problems/new">
                  New report <ArrowUpRight size={13} />
                </Link>
              </div>
              {d.problems.length ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Challenge</th>
                        <th>Status</th>
                        <th>Solutions</th>
                        <th>Submitted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.problems.map((p: any) => (
                        <tr key={p.id}>
                          <td>
                            <Link href={`/problems/${p.id}`}>{p.title}</Link>
                            <small>
                              {p.city} · {p.category} {p.isDemo && "· Demo"}
                            </small>
                          </td>
                          <td>
                            <Status value={p.status} />
                          </td>
                          <td>{p._count.proposals}</td>
                          <td>{date(p.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty
                  title="Every change starts somewhere"
                  description="Report your first community challenge and track its progress here."
                />
              )}
            </div>
          )}
          {["RESEARCHER", "INSTITUTION"].includes(role) && (
            <div className="dashboard-panel">
              <div className="panel-heading">
                <h2>
                  {role === "INSTITUTION" ? "Institution proposals" : "Your innovation portfolio"}
                </h2>
                <Link href="/solutions/new">
                  Propose an idea <ArrowUpRight size={13} />
                </Link>
              </div>
              {d.proposals.length ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Innovation</th>
                        <th>Status</th>
                        <th>Submitted</th>
                        <th>Workspace</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.proposals.map((s: any) => (
                        <tr key={s.id}>
                          <td>
                            <Link href={`/innovations/${s.id}`}>{s.title}</Link>
                            <small>
                              {s.problem.city} · {s.problem.category}
                            </small>
                          </td>
                          <td>
                            <Status value={s.status} />
                          </td>
                          <td>{date(s.createdAt)}</td>
                          <td>
                            {s.collaboration ? (
                              <Link
                                className="text-link"
                                href={`/collaborations/${s.collaboration.id}`}
                              >
                                Open <ArrowUpRight size={12} />
                              </Link>
                            ) : (
                              "In review"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty
                  title="An idea worth sharing"
                  description="Find an open challenge and submit your first proposal."
                />
              )}
            </div>
          )}
          {role === "INDUSTRY" && (
            <div className="dashboard-panel">
              <div className="panel-heading">
                <h2>Your support commitments</h2>
                <Link href="/innovations">
                  Explore innovations <ArrowUpRight size={13} />
                </Link>
              </div>
              {d.support.length ? (
                d.support.map((s: any) => (
                  <div className="proposal-row" key={s.id}>
                    <div>
                      <h3>{s.collaboration.proposal.title}</h3>
                      <p>
                        {s.type.toLowerCase().replaceAll("_", " ")} · {s.description}
                      </p>
                      <Status value={s.status} />
                    </div>
                    {s.status === "ACCEPTED" && (
                      <Link className="text-link" href={`/collaborations/${s.collaborationId}`}>
                        Workspace
                        <ArrowUpRight size={14} />
                      </Link>
                    )}
                  </div>
                ))
              ) : (
                <Empty
                  title="Your expertise can be the missing piece"
                  description="Offer mentorship, resources, or funding interest to an approved innovation."
                />
              )}
            </div>
          )}
          <div className="dashboard-panel">
            <div className="panel-heading">
              <h2>
                <Bell size={16} style={{ display: "inline", marginRight: 8 }} />
                Your recent activity
              </h2>
              <Link href="/notifications">All notifications</Link>
            </div>
            {d.notifications.length ? (
              d.notifications.slice(0, 4).map((n: any) => (
                <Link className="proposal-row" href={n.href} key={n.id}>
                  <div>
                    <h3>{n.title}</h3>
                    <p>{n.body}</p>
                    <small className="muted">{date(n.createdAt)}</small>
                  </div>
                  <ArrowUpRight size={16} />
                </Link>
              ))
            ) : (
              <p className="muted">Updates to your reports and collaborations will appear here.</p>
            )}
          </div>
          {d.achievements.length > 0 && (
            <div className="dashboard-panel">
              <div className="panel-heading">
                <h2>Your recognized contributions</h2>
                <Link href="/leaderboard">Leaderboard</Link>
              </div>
              <div className="achievement-list">
                {d.achievements.map((a: any) => (
                  <div className="achievement" key={a.id}>
                    <Lightbulb size={17} />
                    {a.label} · {a.points} points
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="section-heading space-top">
            <div>
              <h2 style={{ fontSize: 23 }}>
                {role === "RESEARCHER"
                  ? "Matched to your interests"
                  : "Where you can make a difference"}
              </h2>
              <p>
                {role === "RESEARCHER"
                  ? "Rule-based matching using your profile skills and category interests."
                  : "Explore opportunities across the community."}
              </p>
            </div>
            <Link className="text-link" href="/explore">
              Explore all <ArrowUpRight size={14} />
            </Link>
          </div>
          <div
            className="challenge-grid"
            style={{ gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}
          >
            {d.recommended.slice(0, 3).map((p: any) => (
              <ProblemCard key={p.id} problem={p} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
