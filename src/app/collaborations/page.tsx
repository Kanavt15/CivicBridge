"use client";
import Link from "next/link";
import { ArrowUpRight, Handshake, CheckCircle2 } from "lucide-react";
import { useData } from "@/lib/client";
import { PageIntro, Loading, ErrorState, Empty, Status } from "@/components/common";
import { Button } from "@/components/ui/button";
export default function Collaborations() {
  const { data, error, loading, reload } = useData("collaborations");
  return (
    <div className="container page-wrap">
      <PageIntro
        eyebrow="A space to build, together"
        title="Where ideas become shared work."
        description="Private workspaces for approved innovation teams and their accepted partners."
        action={
          <Button asChild variant="outline">
            <Link href="/innovations">
              Find a project to support <ArrowUpRight size={16} />
            </Link>
          </Button>
        }
      />
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} retry={reload} />
      ) : !data?.length ? (
        <Empty
          title="Your next collaboration is ahead"
          description="A workspace opens when your proposal is approved or your support request is accepted."
        />
      ) : (
        <div className="team-grid">
          {data.map((c: any) => {
            const done = c.milestones.filter((m: any) => m.completedAt).length;
            return (
              <Link className="team-card" href={`/collaborations/${c.id}`} key={c.id}>
                <div className="detail-badges">
                  <span className="mini-icon teal">
                    <Handshake size={19} />
                  </span>
                  <Status value={c.proposal.status} />
                </div>
                <h3>{c.proposal.title}</h3>
                <p>{c.proposal.problem.title}</p>
                <small className="muted">
                  {c.proposal.team?.name || "Independent team"} · {c.proposal.problem.city}
                </small>
                <div className="progress-bar space-top">
                  <span
                    style={{
                      width: `${c._count.milestones ? (done / c._count.milestones) * 100 : 0}%`,
                    }}
                  />
                </div>
                <div className="side-row">
                  <span>
                    <CheckCircle2 size={12} style={{ display: "inline" }} /> {done}/
                    {c._count.milestones} milestones · {c._count.tasks} tasks
                  </span>
                  <ArrowUpRight size={17} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
