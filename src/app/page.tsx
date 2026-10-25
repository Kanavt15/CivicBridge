import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  CircleArrowRight,
  Globe2,
  GraduationCap,
  Handshake,
  Lightbulb,
  MapPin,
  MoveUpRight,
  Plus,
  Send,
  Sparkles,
  Users,
} from "lucide-react";
import { db } from "@/lib/db";
import { platformStats } from "@/lib/queries";
import { publicStatuses } from "@/lib/domain";
import { Button } from "@/components/ui/button";
import { ProblemCard } from "@/components/common";
import { IndiaNetwork } from "@/components/india-network";
export const dynamic = "force-dynamic";
export default async function Home() {
  const [stats, featured, stories, orgs] = await Promise.all([
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
    db.solutionProposal.findMany({
      where: { status: { in: ["PILOT", "COMPLETED"] } },
      include: {
        problem: { select: { city: true, category: true, population: true } },
        team: { select: { name: true } },
      },
      take: 2,
    }),
    db.organization.findMany({ where: { verified: true }, take: 5 }),
  ]);
  return (
    <>
      <section className="hero">
        <div className="container hero-layout">
          <div className="hero-copy">
            <div className="hero-badge">
              <span className="live-dot" /> Big change starts with all of us{" "}
              <ArrowUpRight size={13} />
            </div>
            <h1>
              Turning society’s
              <br />
              challenges into
              <br />
              <span>tomorrow’s innovations.</span>
            </h1>
            <p>
              A unified platform connecting citizens, academic institutions, and industries to solve
              real-world challenges. Because a better India is something we build together.
            </p>
            <div className="hero-buttons">
              <Button asChild size="lg">
                <Link href="/problems/new">
                  <Plus size={19} />
                  Report a problem
                  <ArrowUpRight size={17} />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/explore">
                  Explore challenges
                  <ArrowRight size={17} />
                </Link>
              </Button>
            </div>
            <div className="hero-proof">
              <span>
                <CheckCircle2 size={15} /> Community led
              </span>
              <span>
                <CheckCircle2 size={15} /> Innovation driven
              </span>
              <span>
                <CheckCircle2 size={15} /> Impact focused
              </span>
            </div>
          </div>
          <IndiaNetwork open={stats.problems} resolved={stats.resolved} />
        </div>
      </section>
      <section className="stat-section">
        <div className="container stats-grid">
          {[
            [stats.problems, "Societal challenges", Globe2],
            [stats.contributors, "Changemakers connected", Users],
            [stats.innovations, "Innovations in action", Lightbulb],
            [stats.organizations, "Ecosystem partners", Handshake],
          ].map(([num, text, Icon]: any, i) => (
            <div className="stat-item" key={text}>
              <span className={`stat-icon stat-icon-${i}`}>
                <Icon size={22} />
              </span>
              <div>
                <strong>
                  {Number(num).toLocaleString("en-IN")}
                  <span>+</span>
                </strong>
                <span>{text}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="container data-note">
          <span className="live-dot" />
          Live from the platform{" "}
          {stats.demo > 0 && <span>· Includes clearly labeled demonstration records</span>}
        </div>
      </section>
      <section className="partners-band container">
        <span>
          Better together.
          <br />
          <strong>Our innovation ecosystem.</strong>
        </span>
        <div className="partner-logos">
          {orgs.map((o, i) => (
            <Link href="/organizations" key={o.id}>
              <span className="partner-symbol">
                {i % 2 === 0 ? <GraduationCap size={26} /> : <Globe2 size={25} />}
              </span>
              <span>
                {o.name}
                <small>{o.isDemo ? "Illustrative demo partner" : "Verified organization"}</small>
              </span>
            </Link>
          ))}
        </div>
      </section>
      <section className="section section-soft" id="challenges">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="section-kicker">
                <span /> Challenges worth solving
              </span>
              <h2>Real problems. Room for your ideas.</h2>
              <p>Find a challenge that matters to you. Be part of what comes next.</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/explore">
                View all challenges <ArrowUpRight size={16} />
              </Link>
            </Button>
          </div>
          <div className="challenge-grid">
            {featured.map((p) => (
              <ProblemCard key={p.id} problem={p} />
            ))}
          </div>
          <div className="challenge-invite">
            <span>
              <Lightbulb size={17} />
              See something that needs to change in your community?
            </span>
            <Link href="/problems/new">
              Put it on the map <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
      <section className="section how-section" id="how-it-works">
        <div className="container">
          <div className="center-heading">
            <span className="section-kicker">A simple idea. A powerful journey.</span>
            <h2>From “someone should” to “we did.”</h2>
            <p>Every meaningful innovation begins with someone who cares.</p>
          </div>
          <div className="how-grid">
            {[
              {
                icon: MapPin,
                title: "Spot a challenge",
                copy: "Share a real issue in your community. A local perspective is where progress begins.",
                step: "01",
                href: "/problems/new",
                cta: "Report a problem",
              },
              {
                icon: Lightbulb,
                title: "Bring an idea",
                copy: "Researchers and student teams turn lived challenges into practical, thoughtful solutions.",
                step: "02",
                href: "/explore",
                cta: "Find your challenge",
              },
              {
                icon: Handshake,
                title: "Build it together",
                copy: "Connect with institutions, mentors, and industry partners to bring good ideas to life.",
                step: "03",
                href: "/innovations",
                cta: "Explore innovations",
              },
              {
                icon: CircleArrowRight,
                title: "Make a difference",
                copy: "Pilot, measure, and grow. Follow the journey from first idea to lasting community impact.",
                step: "04",
                href: "/impact",
                cta: "See the impact",
              },
            ].map(({ icon: Icon, ...s }) => (
              <div className="how-step" key={s.step}>
                <div className="step-top">
                  <span className="how-icon">
                    <Icon size={25} />
                  </span>
                  <span className="step-number">{s.step}</span>
                </div>
                <h3>{s.title}</h3>
                <p>{s.copy}</p>
                <Link href={s.href}>
                  {s.cta}
                  <ArrowUpRight size={15} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section stories-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="section-kicker">
                <span /> Innovation in motion
              </span>
              <h2>Good ideas deserve to go places.</h2>
              <p>Meet the projects moving from possibility to positive change.</p>
            </div>
            <Link className="text-link" href="/innovations">
              Discover innovations <ArrowUpRight size={17} />
            </Link>
          </div>
          <div className="stories-grid">
            {stories.map((s, i) => (
              <Link className={`story-card story-${i}`} href={`/innovations/${s.id}`} key={s.id}>
                <div className="story-visual">
                  <div className="story-orb">
                    <span />
                    {i === 0 ? (
                      <Lightbulb size={68} strokeWidth={1} />
                    ) : (
                      <Globe2 size={68} strokeWidth={1} />
                    )}
                  </div>
                  <span className="story-label">
                    {s.status === "COMPLETED" ? (
                      <>
                        <Check size={13} /> Completed pilot
                      </>
                    ) : (
                      <>
                        <span className="live-dot" /> Pilot in progress
                      </>
                    )}
                  </span>
                </div>
                <div className="story-body">
                  <small>
                    {s.problem.category} {s.isDemo && "· Demonstration project"}
                  </small>
                  <h3>{s.title}</h3>
                  <p>{s.impact}</p>
                  <div>
                    <span>
                      {s.team?.name || "Independent innovation"} <span>· {s.problem.city}</span>
                    </span>
                    <ArrowUpRight size={20} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="container cta-section">
        <div className="cta-bridge" aria-hidden="true">
          <svg viewBox="0 0 360 200" fill="none">
            <path
              d="M10 170h340M55 170V68m250 102V68M55 96C155 96 105 15 180 15S205 96 305 96M180 15v155M55 96v74M90 88v82M125 60v110M235 60v110M270 88v82"
              stroke="currentColor"
              strokeWidth="2"
            />
            <circle cx="180" cy="15" r="5" fill="currentColor" />
          </svg>
        </div>
        <div>
          <span className="section-kicker">Your perspective could change everything.</span>
          <h2>
            A better tomorrow
            <br />
            needs you today.
          </h2>
          <p>
            A challenge to share. An idea to explore. A hand to lend.
            <br />
            There’s a place for you on CivicBridge.
          </p>
          <Button asChild size="lg">
            <Link href="/register">
              Let’s build something that matters <ArrowUpRight size={18} />
            </Link>
          </Button>
        </div>
        <div className="cta-side">
          <span>
            <Users size={19} />
            Citizens with a voice
          </span>
          <span>
            <GraduationCap size={19} />
            Minds with a mission
          </span>
          <span>
            <Handshake size={19} />
            Partners with a purpose
          </span>
        </div>
      </section>
    </>
  );
}
