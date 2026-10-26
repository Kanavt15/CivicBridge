"use client";
import { LocalDate } from "@/components/i18n";

import { Control } from "@/components/localized-fields";
import { Text } from "@/components/i18n";

import { useState } from "react";
import Link from "@/components/localized-fields";
import { toast } from "sonner";
import { ArrowUpRight } from "lucide-react";
import { api, useData } from "@/lib/client";
import { date, label } from "@/lib/utils";
import { PageIntro, Loading, ErrorState, Status, DemoBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { EvidenceReview } from "@/components/evidence";
export default function Admin() {
  const { data: d, error, loading, reload } = useData("admin");
  const [tab, setTab] = useState(
      typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).get("tab") === "evidence"
        ? "evidence"
        : "problems",
    ),
    [busy, setBusy] = useState(false);
  async function update(path: string, input: any) {
    setBusy(true);
    try {
      await api(`admin/${path}`, "PATCH", input);
      toast.success("Record updated.");
      await reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (loading) return <Loading />;
  if (error || !d) return <ErrorState error={error} retry={reload} />;
  return (
    <div className="container page-wrap">
      <PageIntro
        eyebrow="Platform administration"
        title="Keep the bridge moving."
        description="Review submissions, verify organizations, and follow the decisions shaping the platform."
        action={
          <Button asChild variant="outline">
            <Link href="/operations">
              <Text>{"Open review queue"}</Text>
              <ArrowUpRight size={15} />
            </Link>
          </Button>
        }
      />
      <div className="metric-grid">
        {[
          [
            d.problems.filter((p: any) => ["REPORTED", "UNDER_REVIEW"].includes(p.status)).length,
            "Reports awaiting review",
          ],
          [
            d.proposals.filter((p: any) =>
              ["SUBMITTED", "UNDER_REVIEW", "SHORTLISTED"].includes(p.status),
            ).length,
            "Proposals in review",
          ],
          [d.organizations.filter((o: any) => !o.verified).length, "Unverified organizations"],
          [d.users.length, "Loaded users"],
        ].map(([v, t]: any) => (
          <div className="metric-card" key={t}>
            <span>{t}</span>
            <strong>{v}</strong>
            <small>
              <Text>{"Latest 200 records per table"}</Text>
            </small>
          </div>
        ))}
      </div>
      <div className="tabs" role="tablist">
        {["problems", "proposals", "organizations", "users", "logs", "evidence"].map((t) => (
          <Control
            key={t}
            role="tab"
            aria-selected={tab === t}
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
          >
            {t === "logs" ? "Audit history" : label(t)}
          </Control>
        ))}
      </div>
      {tab === "evidence" ? (
        <EvidenceReview />
      ) : (
        <div className="table-wrap">
          <table>
            {tab === "problems" ? (
              <>
                <thead>
                  <tr>
                    <th>
                      <Text>{"Report"}</Text>
                    </th>
                    <th>
                      <Text>{"Contributor"}</Text>
                    </th>
                    <th>
                      <Text>{"Status"}</Text>
                    </th>
                    <th>
                      <Text>{"Submitted"}</Text>
                    </th>
                    <th>
                      <Text>{"Review"}</Text>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {d.problems.map((p: any) => (
                    <tr key={p.id}>
                      <td>
                        {p.title}
                        {p.isDemo && (
                          <>
                            {" "}
                            <DemoBadge />
                          </>
                        )}
                        <small>
                          {p.city} · <Text>{p.category}</Text>
                        </small>
                      </td>
                      <td>{p.author.name}</td>
                      <td>
                        <Status value={p.status} />
                      </td>
                      <td>
                        <LocalDate value={p.createdAt} />
                      </td>
                      <td>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/problems/${p.id}`}>
                            <Text>{"Review"}</Text>
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </>
            ) : tab === "proposals" ? (
              <>
                <thead>
                  <tr>
                    <th>
                      <Text>{"Proposal"}</Text>
                    </th>
                    <th>
                      <Text>{"Researcher"}</Text>
                    </th>
                    <th>
                      <Text>{"Status"}</Text>
                    </th>
                    <th>
                      <Text>{"Submitted"}</Text>
                    </th>
                    <th>
                      <Text>{"Review"}</Text>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {d.proposals.map((p: any) => (
                    <tr key={p.id}>
                      <td>
                        {p.title}
                        <small>{p.problem.title}</small>
                      </td>
                      <td>{p.author.name}</td>
                      <td>
                        <Status value={p.status} />
                      </td>
                      <td>
                        <LocalDate value={p.createdAt} />
                      </td>
                      <td>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/innovations/${p.id}`}>
                            <Text>{"Review"}</Text>
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </>
            ) : tab === "organizations" ? (
              <>
                <thead>
                  <tr>
                    <th>
                      <Text>{"Organization"}</Text>
                    </th>
                    <th>
                      <Text>{"Type"}</Text>
                    </th>
                    <th>
                      <Text>{"City"}</Text>
                    </th>
                    <th>
                      <Text>{"Verification"}</Text>
                    </th>
                    <th>
                      <Text>{"Action"}</Text>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {d.organizations.map((o: any) => (
                    <tr key={o.id}>
                      <td>
                        {o.name}
                        {o.isDemo && (
                          <>
                            {" "}
                            <DemoBadge />
                          </>
                        )}
                      </td>
                      <td>{label(o.type)}</td>
                      <td>{o.city}</td>
                      <td>
                        <Status value={o.verified ? "APPROVED" : "PENDING"} />
                      </td>
                      <td>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={busy}
                          onClick={() =>
                            update("organizations", { id: o.id, verified: !o.verified })
                          }
                        >
                          <Text>{o.verified ? "Revoke verification" : "Verify"}</Text>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </>
            ) : tab === "users" ? (
              <>
                <thead>
                  <tr>
                    <th>
                      <Text>{"User"}</Text>
                    </th>
                    <th>
                      <Text>{"Role"}</Text>
                    </th>
                    <th>
                      <Text>{"Organization"}</Text>
                    </th>
                    <th>
                      <Text>{"Status"}</Text>
                    </th>
                    <th>
                      <Text>{"Action"}</Text>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {d.users.map((u: any) => (
                    <tr key={u.id}>
                      <td>
                        {u.name}
                        <small>{u.email}</small>
                      </td>
                      <td>{label(u.role)}</td>
                      <td>{u.organization?.name || "Independent"}</td>
                      <td>
                        <Text>{u.active ? "Active" : "Deactivated"}</Text>
                      </td>
                      <td>
                        {u.role !== "ADMIN" && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={busy}
                            onClick={() => update("users", { id: u.id, active: !u.active })}
                          >
                            <Text>{u.active ? "Deactivate" : "Reactivate"}</Text>
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </>
            ) : (
              <>
                <thead>
                  <tr>
                    <th>
                      <Text>{"Action"}</Text>
                    </th>
                    <th>
                      <Text>{"Actor"}</Text>
                    </th>
                    <th>
                      <Text>{"Entity"}</Text>
                    </th>
                    <th>
                      <Text>{"Change"}</Text>
                    </th>
                    <th>
                      <Text>{"When"}</Text>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {d.logs.map((l: any) => (
                    <tr key={l.id}>
                      <td>
                        {label(l.action)}
                        <small>{l.note}</small>
                      </td>
                      <td>{l.actor.name}</td>
                      <td>
                        {l.entityType}
                        <small>{l.entityId}</small>
                      </td>
                      <td>
                        {l.fromStatus ? `${label(l.fromStatus)} → ` : ""}
                        {l.toStatus && label(l.toStatus)}
                      </td>
                      <td>
                        <LocalDate value={l.createdAt} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}
          </table>
        </div>
      )}
    </div>
  );
}
