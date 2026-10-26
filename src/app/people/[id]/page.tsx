"use client";
import { Text } from "@/components/i18n";

import { use } from "react";
import Link from "@/components/localized-fields";
import { Award, ArrowUpRight } from "lucide-react";
import { useData } from "@/lib/client";
import { initials, label } from "@/lib/utils";
import { PageIntro, Loading, ErrorState, Status, DemoBadge, Badge } from "@/components/common";
export default function Profile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: u, error, loading, reload } = useData(`people/${id}`);
  if (loading) return <Loading />;
  if (error || !u) return <ErrorState error={error} retry={reload} />;
  return (
    <div className="container page-wrap">
      <div className="avatar space-top" style={{ height: 64, width: 64, fontSize: 23 }}>
        {initials(u.name)}
      </div>
      <PageIntro
        eyebrow={`${label(u.role)} · ${u.organization?.name || "Independent contributor"}`}
        title={u.name}
        content
        description={u.bio || "Part of the CivicBridge community."}
        action={u.isDemo ? <DemoBadge /> : undefined}
      />
      <div className="tag-list">
        {u.skills.map((s: string) => (
          <Badge key={s}>{s}</Badge>
        ))}
      </div>
      <div className="achievement-list">
        {u.achievements.map((a: any, i: number) => (
          <span className="achievement" key={i}>
            <Award size={17} />
            {a.label} · {a.points} <Text>{"points"}</Text>
          </span>
        ))}
      </div>
      <div className="section-heading space-top">
        <h2 style={{ fontSize: 24 }}>
          <Text>{"Innovation portfolio"}</Text>
        </h2>
      </div>
      {u.proposals.length ? (
        <div className="team-grid">
          {u.proposals.map((p: any) => (
            <Link href={`/innovations/${p.id}`} key={p.id} className="team-card">
              <Status value={p.status} />
              <h3>{p.title}</h3>
              <p>
                <Text>{p.problem.category}</Text> · {p.problem.city}
              </p>
              <span className="text-link">
                <Text>{"Explore innovation"}</Text>
                <ArrowUpRight size={15} />
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="muted">
          <Text>{"Approved innovations will appear here."}</Text>
        </p>
      )}
    </div>
  );
}
