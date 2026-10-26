"use client";
import { Text } from "@/components/i18n";

import Link from "@/components/localized-fields";
import { ArrowUpRight, Lightbulb, MapPin } from "lucide-react";
import { useData } from "@/lib/client";
import {
  Breadcrumbs,
  PageIntro,
  Loading,
  ErrorState,
  Empty,
  Status,
  DemoBadge,
  CategoryIcon,
} from "@/components/common";
import { Button } from "@/components/ui/button";
export default function Innovations() {
  const { data, error, loading, reload } = useData("proposals");
  return (
    <div className="container page-wrap">
      <Breadcrumbs items={[{ label: "Innovations" }]} />
      <PageIntro
        eyebrow="Ideas that move us forward"
        title="Explore solutions"
        description="Practical ideas from your community."
        action={
          <Button asChild>
            <Link href="/solutions/new">
              <Lightbulb size={16} />
              <Text>{"Propose a solution"}</Text>
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
          title="The next innovation could be yours"
          description="Explore an open challenge and share an idea."
          action={
            <Button asChild>
              <Link href="/explore">
                <Text>{"Explore challenges"}</Text>
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="team-grid">
          {data.map((s: any) => (
            <Link href={`/innovations/${s.id}`} className="team-card" key={s.id}>
              <div className="detail-badges">
                <span className="mini-icon teal">
                  <CategoryIcon category={s.problem.category} />
                </span>
                <Status value={s.status} />
                {s.isDemo && <DemoBadge />}
              </div>
              <h3>{s.title}</h3>
              <p>{s.impact}</p>
              <div className="side-row">
                <span>
                  <MapPin size={12} /> {s.problem.city}
                </span>
                <ArrowUpRight size={18} />
              </div>
              <small className="muted">
                {s.team?.name || s.author.name} · <Text>{s.problem.category}</Text>
              </small>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
