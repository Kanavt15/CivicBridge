"use client";
import Link from "next/link";
import { GraduationCap, Handshake, MapPin, ArrowUpRight } from "lucide-react";
import { useData } from "@/lib/client";
import { PageIntro, Loading, ErrorState, Empty, DemoBadge, Badge } from "@/components/common";
import { Button } from "@/components/ui/button";
export default function Organizations() {
  const { data, error, loading, reload } = useData("organizations");
  return (
    <div className="container page-wrap">
      <PageIntro
        eyebrow="Stronger through connection"
        title="An ecosystem with a purpose."
        description="Academic institutions, industries, and community organizations bringing knowledge and resources to local challenges."
        action={
          <Button asChild>
            <Link href="/register">
              Join the ecosystem <ArrowUpRight size={15} />
            </Link>
          </Button>
        }
      />
      <div className="info-box" style={{ marginBottom: 25 }}>
        <strong>A demonstration ecosystem.</strong>
        <p>
          Organizations labeled “Demo” are illustrative records. Their inclusion does not indicate
          actual affiliation, endorsement, or a partnership with CivicBridge.
        </p>
      </div>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} retry={reload} />
      ) : !data?.length ? (
        <Empty
          title="Make the first connection"
          description="Register an institution or industry account to join the ecosystem."
        />
      ) : (
        <div className="team-grid">
          {data.map((o: any) => (
            <article className="team-card" key={o.id}>
              <div className="detail-badges">
                <span className="mini-icon teal">
                  {o.type === "INSTITUTION" ? <GraduationCap size={22} /> : <Handshake size={22} />}
                </span>
                <Badge type="approved">Verified organization</Badge>
                {o.isDemo && <DemoBadge />}
              </div>
              <h3>{o.name}</h3>
              <p>{o.description || "Part of the CivicBridge innovation ecosystem."}</p>
              <div className="side-row">
                <span>
                  <MapPin size={12} style={{ display: "inline" }} /> {o.city}
                </span>
                <span>{o._count.teams} teams</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
