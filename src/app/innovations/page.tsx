"use client";
import Link from "next/link";
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
        title="Made for the world around us."
        description="Discover community-centered innovations, from promising proposals to real-world pilots."
        action={
          <Button asChild>
            <Link href="/solutions/new">
              <Lightbulb size={16} />
              Propose a solution
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
              <Link href="/explore">Explore challenges</Link>
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
                {s.team?.name || s.author.name} · {s.problem.category}
              </small>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
