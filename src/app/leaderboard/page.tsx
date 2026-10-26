"use client";
import { Text } from "@/components/i18n";

import Link from "@/components/localized-fields";
import { Trophy, Award, ArrowUpRight } from "lucide-react";
import { useData } from "@/lib/client";
import { initials } from "@/lib/utils";
import { PageIntro, Loading, ErrorState, Empty, DemoBadge } from "@/components/common";
export default function Leaderboard() {
  const { data, error, loading, reload } = useData("leaderboard");
  const people = data
    ?.map((u: any) => ({
      ...u,
      points: u.achievements.reduce((sum: number, a: any) => sum + a.points, 0),
    }))
    .sort((a: any, b: any) => b.points - a.points);
  return (
    <div className="container page-wrap">
      <PageIntro
        eyebrow="Recognizing work that matters"
        title="People making the difference."
        description="Points celebrate verified outcomes: approved ideas, completed pilots, and resolved community challenges."
      />
      <div className="info-box" style={{ marginBottom: 25 }}>
        <strong>
          <Text>{"Contribution over repetition."}</Text>
        </strong>
        <p>
          <Text>
            {
              "Admin-verified milestone: 20 points. Approved solution: 50 points. Completed pilot: 150 points. A reported challenge resolved: 100 points. Each reward is issued once per verified action. Repeated submissions and votes earn no points. Demo accounts are labeled."
            }
          </Text>
        </p>
      </div>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} retry={reload} />
      ) : !people?.length ? (
        <Empty
          title="The first chapter is yours to write"
          description="Verified community contributions will be recognized here."
        />
      ) : (
        <div className="dashboard-panel">
          {people.map((u: any, i: number) => (
            <Link className="leader-row" href={`/people/${u.id}`} key={u.id}>
              <span className="rank">
                {i === 0 ? <Trophy size={24} /> : String(i + 1).padStart(2, "0")}
              </span>
              <span className="avatar">{initials(u.name)}</span>
              <div>
                <h3>
                  {u.name} {u.isDemo && <DemoBadge />}
                </h3>
                <small>{u.organization?.name || "Independent contributor"}</small>
                <div className="achievement-list">
                  {[...new Set(u.achievements.map((a: any) => a.label))].map((l: any) => (
                    <span key={l} className="badge badge-approved">
                      <Award size={11} />
                      {l}
                    </span>
                  ))}
                </div>
              </div>
              <div className="points">
                {u.points}
                <small>
                  <Text>{"contribution points"}</Text>
                </small>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
