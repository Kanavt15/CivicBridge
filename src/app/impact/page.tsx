import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { platformStats } from "@/lib/queries";
import { Breadcrumbs, PageIntro } from "@/components/common";
import { Button } from "@/components/ui/button";
import { ImpactCharts } from "@/components/charts";
export const dynamic = "force-dynamic";
export const metadata = { title: "Community impact" };
export default async function Impact() {
  const s = await platformStats();
  return (
    <div className="container page-wrap">
      <Breadcrumbs items={[{ label: "Community impact" }]} />
      <PageIntro
        eyebrow="Progress you can follow"
        title="Small beginnings. Shared progress."
        description="A transparent view of the challenges, collaborations, and solutions moving our communities forward."
        action={
          <Button asChild variant="outline">
            <Link href="/evidence">
              Explore measured outcomes <ArrowUpRight size={16} />
            </Link>
          </Button>
        }
      />
      <div className="info-box" style={{ marginBottom: 25 }}>
        <strong>Honest numbers, meaningful context.</strong>
        <p>
          All metrics come from the platform database. {s.demo} of {s.problems} public reports are
          demonstration records. Reported population figures and estimated impact scores have not
          been independently verified.
        </p>
      </div>
      <div className="metric-grid">
        {[
          [s.problems, "Public challenges"],
          [s.resolved, "Resolved challenges"],
          [s.innovations, "Approved innovations"],
          [s.population.toLocaleString("en-IN"), "People in resolved reports"],
        ].map(([value, title]) => (
          <div className="metric-card" key={title}>
            <span>{title}</span>
            <strong>{value}</strong>
            <small>Database-backed · includes demo data</small>
          </div>
        ))}
      </div>
      <ImpactCharts stats={s} admin />
      <div className="info-box space-top">
        <h4>How these figures work</h4>
        <p>
          Challenges count public reports from “open for solutions” onward. Innovations count
          approved, pilot, and completed proposals. People in resolved reports is the sum of
          estimated affected populations; it can include overlaps. The trend charts group reports by
          submission month and show their current resolution status.
        </p>
      </div>
    </div>
  );
}
