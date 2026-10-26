"use client";
import { LocalDate } from "@/components/i18n";

import { Select, Textarea } from "@/components/localized-fields";
import { Text } from "@/components/i18n";

import { use, useState } from "react";
import Link from "@/components/localized-fields";
import { useSession } from "next-auth/react";
import { ArrowUpRight, FileText, Users, Calendar } from "lucide-react";
import { toast } from "sonner";
import { api, useData } from "@/lib/client";
import { date } from "@/lib/utils";
import {
  Breadcrumbs,
  Loading,
  ErrorState,
  Status,
  DemoBadge,
  Timeline,
  Badge,
} from "@/components/common";
import { Button } from "@/components/ui/button";
import { StatusControl } from "@/components/status-control";
export default function Innovation({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: s, error, loading, reload } = useData(`proposals/${id}`);
  const { data: session } = useSession();
  const [busy, setBusy] = useState(false);
  async function support(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await api(`collaborations/${s.collaboration.id}/support`, "POST", Object.fromEntries(f));
      toast.success("Collaboration request sent. The project lead will review it.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (loading) return <Loading />;
  if (error || !s) return <ErrorState error={error} retry={reload} />;
  return (
    <div className="container page-wrap">
      <Breadcrumbs items={[{ label: "Innovations", href: "/innovations" }, { label: s.title }]} />
      <div className="detail-header">
        <div className="detail-badges">
          <Badge>
            <Text>{s.problem.category}</Text>
          </Badge>
          <Status value={s.status} />
          {s.isDemo && <DemoBadge />}
        </div>
        <h1>{s.title}</h1>
        <div className="detail-byline">
          <span>
            <Users size={14} />
            <Link href={`/people/${s.author.id}`}>{s.author.name}</Link>
            {s.team && ` · ${s.team.name}`}
          </span>
          <span>
            <Calendar size={14} />
            <LocalDate value={s.createdAt} />
          </span>
        </div>
      </div>
      <div className="two-col">
        <article className="detail-content">
          <h2>
            <Text>{"The challenge behind the idea"}</Text>
          </h2>
          <Link className="text-link" href={`/problems/${s.problem.id}`}>
            {s.problem.title}
            <ArrowUpRight size={16} />
          </Link>
          {[
            ["Proposed approach", s.approach],
            ["Technology and methods", s.techStack],
            ["Expected impact", s.impact],
            ["Feasibility and implementation", s.feasibility],
            ["Required resources", s.resources],
          ].map(([name, value]) => (
            <section className="detail-section" key={name}>
              <h2>{name}</h2>
              <p className="prose-text">{value}</p>
            </section>
          ))}
          {s.attachments.length > 0 && (
            <section className="detail-section">
              <h2>
                <Text>{"Supporting documents"}</Text>
              </h2>
              {s.attachments.map((a: any) => (
                <a
                  key={a.id}
                  className="upload-file"
                  href={`/api/files/${a.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <FileText size={17} />
                  {a.name}
                  <ArrowUpRight size={15} />
                </a>
              ))}
            </section>
          )}
        </article>
        <aside className="side-stack">
          {s.collaboration && (
            <div className="side-card">
              <h3>
                <Text>{"Build it together."}</Text>
              </h3>
              <p>
                <Text>
                  {
                    "This innovation has an active collaboration workspace. Access is available to the team and accepted partners."
                  }
                </Text>
              </p>
              <Button asChild>
                <Link href={`/collaborations/${s.collaboration.id}`}>
                  <Text>{"Open workspace"}</Text>
                  <ArrowUpRight size={16} />
                </Link>
              </Button>
            </div>
          )}
          {s.collaboration &&
            session &&
            ["INDUSTRY", "INSTITUTION", "ADMIN"].includes(session.user.role) && (
              <div className="side-card">
                <h3>
                  <Text>{"Offer your support"}</Text>
                </h3>
                <p className="space-top">
                  <Text>
                    {"Share resources, expertise, or funding interest. No payments are collected."}
                  </Text>
                </p>
                <form className="form-stack space-top" onSubmit={support}>
                  <label className="field">
                    <Text>{"Type of support"}</Text>
                    <Select name="type">
                      <option value="MENTORSHIP">
                        <Text>{"Mentorship"}</Text>
                      </option>
                      <option value="RESOURCES">
                        <Text>{"Equipment / resources"}</Text>
                      </option>
                      <option value="EXPERTISE">
                        <Text>{"Technical expertise"}</Text>
                      </option>
                      <option value="FUNDING_INTEREST">
                        <Text>{"Funding interest"}</Text>
                      </option>
                    </Select>
                  </label>
                  <label className="field">
                    <Text>{"What can you contribute?"}</Text>
                    <Textarea
                      name="description"
                      minLength={20}
                      maxLength={3000}
                      required
                      placeholder="Describe your contribution and availability."
                    />
                  </label>
                  <Button type="submit" disabled={busy}>
                    <Text>{busy ? "Sending…" : "Send collaboration request"}</Text>
                  </Button>
                </form>
              </div>
            )}
          {s.canReview && (
            <div className="side-card">
              <h3>
                <Text>{"Review proposal"}</Text>
              </h3>
              <StatusControl
                type="proposals"
                id={id}
                status={s.status}
                onUpdate={reload}
                limited={session?.user.role === "INSTITUTION"}
              />
            </div>
          )}
          <div className="side-card">
            <h3>
              <Text>{"Proposal timeline"}</Text>
            </h3>
            {s.timeline.length ? (
              <Timeline items={s.timeline} />
            ) : (
              <p>
                <Text>{"Demonstration proposal. Current status: "}</Text>
                {s.status.toLowerCase()}.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
