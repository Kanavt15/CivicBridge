import Link from "next/link";
import {
  Plus,
  ArrowRight,
  MapPin,
  Users,
  Lightbulb,
  Check,
  MessageSquare,
  Handshake,
  ChartNoAxesCombined,
} from "lucide-react";
import { db } from "@/lib/db";
import { platformStats } from "@/lib/queries";
import { publicStatuses } from "@/lib/domain";
import { Button } from "@/components/ui/button";
import { ProblemCard } from "@/components/common";
import { Text } from "@/components/i18n";
import { LiveServerView } from "@/components/live-server-view";
export const dynamic = "force-dynamic";
function Neighbourhood() {
  return (
    <div className="neighbourhood" aria-hidden="true">
      <svg viewBox="0 0 500 370" fill="none">
        <path d="M30 220 235 100l235 125-207 120L30 220Z" fill="#f0f0f0" />
        <path
          d="m50 222 205-119m-124 163 203-118m-124 159 201-118M118 168l235 126M196 123l235 125"
          stroke="white"
          strokeWidth="19"
        />
        <path d="m90 173 45-26 45 24-45 27-45-25Z" fill="#e5e5e5" />
        <path d="M90 173v39l45 25v-39m45-27v40l-45 26" fill="#d8d8d8" />
        <path d="m270 161 49-28 48 25-48 29-49-26Z" fill="#ffffff" />
        <path d="M270 161v55l49 26v-55m48-29v55l-48 29" fill="#dddddd" />
        <path d="m193 243 51-30 50 27-51 30-50-27Z" fill="#ffffff" />
        <path d="M193 243v39l50 27v-39m51-30v40l-51 29" fill="#dddddd" />
        <path
          d="M144 124c0-17 14-31 31-31s31 14 31 31c0 22-31 48-31 48s-31-26-31-48Z"
          fill="#5d5d5d"
        />
        <circle cx="175" cy="124" r="10" fill="white" />
        <path
          d="M326 103c0-13 11-24 24-24s24 11 24 24c0 17-24 37-24 37s-24-20-24-37Z"
          fill="#5d5d5d"
          opacity=".4"
        />
        <circle cx="350" cy="103" r="7" fill="white" />
        <path
          d="M234 212c0-14 11-25 25-25s25 11 25 25c0 18-25 38-25 38s-25-20-25-38Z"
          fill="#5d5d5d"
        />
        <circle cx="259" cy="212" r="8" fill="white" />
      </svg>
      <div className="neighbourhood-note">
        <span>
          <Check size={17} />
        </span>
        <div>
          <strong>
            <Text>A place for local progress</Text>
          </strong>
          <small>
            <Text>Share a local problem.</Text>
          </small>
        </div>
      </div>
    </div>
  );
}
export default async function Home() {
  const [stats, featured] = await Promise.all([
    platformStats(),
    db.problem.findMany({
      where: { status: { in: [...publicStatuses] } },
      include: {
        images: { select: { id: true, name: true, mime: true } },
        _count: { select: { votes: true, proposals: true, comments: true } },
      },
      orderBy: [{ urgencyRank: "desc" }, { createdAt: "desc" }],
      take: 3,
    }),
  ]);
  return (
    <>
      <LiveServerView />
      <section className="home-hero container">
        <div className="home-hero-copy">
          <span className="home-context">
            <span className="live-dot" />
            <Text>Independent community platform</Text>
          </span>
          <h1>
            <Text>Better neighbourhoods start with you.</Text>
          </h1>
          <p>
            <Text>Report a local issue. Help build a practical solution.</Text>
          </p>
          <div className="home-actions">
            <Button asChild size="lg">
              <Link href="/problems/new">
                <Plus size={18} />
                <Text>Report a problem</Text>
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/explore">
                <Text>Explore problems</Text>
                <ArrowRight size={17} />
              </Link>
            </Button>
          </div>
          <div className="home-members">
            <span className="member-dots" aria-hidden="true">
              <i>क</i>
              <i>அ</i>
              <i>తె</i>
              <i>ব</i>
            </span>
            <span>
              <Text>Connect ideas with people.</Text>
            </span>
          </div>
        </div>
        <Neighbourhood />
      </section>
      <section className="container home-stats" aria-label="Platform statistics">
        {[
          [stats.problems, "Problems shared", MapPin],
          [stats.contributors, "People contributing", Users],
          [stats.innovations, "Solutions in progress", Lightbulb],
        ].map(([value, text, Icon]: any) => (
          <div key={text}>
            <Icon size={19} />
            <strong>{value}</strong>
            <span>
              <Text>{text}</Text>
            </span>
          </div>
        ))}
        {stats.demo > 0 && (
          <small>
            <Text>Includes labelled demo records.</Text>
          </small>
        )}
      </section>
      <section className="container home-board">
        <div className="section-heading">
          <div>
            <h2>
              <Text>Recently shared</Text>
            </h2>
            <p>
              <Text>Find a problem you can help solve.</Text>
            </p>
          </div>
          <Link className="text-link" href="/explore">
            <Text>View all</Text>
            <ArrowRight size={16} />
          </Link>
        </div>
        <div className="challenge-grid">
          {featured.map((p) => (
            <ProblemCard key={p.id} problem={p} />
          ))}
        </div>
      </section>
      <section className="container home-process" id="how-it-works">
        <div>
          <h2>
            <Text>How it works</Text>
          </h2>
          <p>
            <Text>Choose what you want to do.</Text>
          </p>
        </div>
        <div className="process-items">
          {[
            [MessageSquare, "Share", "Share a local problem."],
            [Handshake, "Collaborate", "Connect ideas with people."],
            [ChartNoAxesCombined, "Track progress", "See what changes."],
          ].map(([Icon, title, copy]: any) => (
            <div key={title}>
              <span>
                <Icon size={21} />
              </span>
              <strong>
                <Text>{title}</Text>
              </strong>
              <p>
                <Text>{copy}</Text>
              </p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
