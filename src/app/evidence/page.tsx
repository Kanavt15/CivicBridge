"use client";
import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { useData } from "@/lib/client";
import { PageIntro, Loading, ErrorState, Empty, Breadcrumbs } from "@/components/common";
import { MeasurementCard } from "@/components/evidence";
import { Button } from "@/components/ui/button";
export default function Evidence() {
  const { data, error, loading, reload } = useData("/api/evidence");
  const projects = new Set(data?.map((m: any) => m.collaborationId) ?? []).size;
  return (
    <div className="container page-wrap">
      <Breadcrumbs items={[{ label: "Impact", href: "/impact" }, { label: "Evidence ledger" }]} />
      <PageIntro
        eyebrow="From promised impact to measured outcomes"
        title="Show the work. Share the evidence."
        description="A public ledger of team-reported outcomes reviewed by platform administrators. Every entry includes its baseline, measured result, method, and supporting evidence."
        action={
          <Button asChild variant="outline">
            <Link href="/collaborations">
              Record an outcome
              <ArrowUpRight size={15} />
            </Link>
          </Button>
        }
      />
      <div className="evidence-banner">
        <ShieldCheck size={25} />
        <div>
          <strong>
            {data?.length ?? 0} reviewed measurements across {projects} projects
          </strong>
          <p>
            Administrator verification records a review of submitted evidence; it is not an
            independent scientific audit. Demo entries are labeled. Values are not summed across
            potentially overlapping populations or time periods.
          </p>
        </div>
      </div>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} retry={reload} />
      ) : !data?.length ? (
        <Empty
          title="Claims need evidence."
          description="The first approved measurements will appear here. Teams can record outcomes from their collaboration workspace."
        />
      ) : (
        <div className="measurement-grid">
          {data.map((m: any) => (
            <MeasurementCard key={m.id} item={m} />
          ))}
        </div>
      )}
    </div>
  );
}
