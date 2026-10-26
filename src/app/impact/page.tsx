import { Text } from "@/components/i18n";
import Link from "@/components/localized-fields";
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
              <Text>{"Explore measured outcomes"}</Text>
              <ArrowUpRight size={16} />
            </Link>
          </Button>
        }
      />
      <details className="info-box" style={{ marginBottom: 25 }}>
        <summary>
          <Text>About these figures</Text>
        </summary>
        <strong>
          <Text>{"Honest numbers, meaningful context."}</Text>
        </strong>
        <p>
          <Text>{"All metrics come from the platform database."}</Text>
          {s.demo} <Text>{" of "}</Text>
          {s.problems}{" "}
          <Text>
            {
              "public reports are demonstration records. Reported population figures and estimated impact scores have not been independently verified."
            }
          </Text>
        </p>
      </details>
      <div className="metric-grid">
        {[
          [s.problems, "Public challenges"],
          [s.resolved, "Resolved challenges"],
          [s.innovations, "Approved innovations"],
          [s.population.toLocaleString("en-IN"), "People in resolved reports"],
        ].map(([value, title]) => (
          <div className="metric-card" key={title}>
            <span>
              <Text>{title}</Text>
            </span>
            <strong>{value}</strong>
            <small>
              <Text>{"Database-backed · includes demo data"}</Text>
            </small>
          </div>
        ))}
      </div>
      <ImpactCharts stats={s} admin />
      <details className="info-box space-top">
        <summary>
          <Text>How these figures work</Text>
        </summary>
        <h4>
          <Text>{"How these figures work"}</Text>
        </h4>
        <p>
          <Text>
            {
              "Challenges count public reports from “open for solutions” onward. Innovations count approved, pilot, and completed proposals. People in resolved reports is the sum of estimated affected populations; it can include overlaps. The trend charts group reports by submission month and show their current resolution status."
            }
          </Text>
        </p>
      </details>
    </div>
  );
}
