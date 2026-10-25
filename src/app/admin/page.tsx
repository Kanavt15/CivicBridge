"use client";
import { useState } from "react";
import Link from "next/link";
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
              Open review queue
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
            <small>Latest 200 records per table</small>
          </div>
        ))}
      </div>
      <div className="tabs" role="tablist">
        {["problems", "proposals", "organizations", "users", "logs", "evidence"].map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
          >
            {t === "logs" ? "Audit history" : label(t)}
          </button>
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
                    <th>Report</th>
                    <th>Contributor</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th>Review</th>
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
                          {p.city} · {p.category}
                        </small>
                      </td>
                      <td>{p.author.name}</td>
                      <td>
                        <Status value={p.status} />
                      </td>
                      <td>{date(p.createdAt)}</td>
                      <td>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/problems/${p.id}`}>Review</Link>
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
                    <th>Proposal</th>
                    <th>Researcher</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th>Review</th>
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
                      <td>{date(p.createdAt)}</td>
                      <td>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/innovations/${p.id}`}>Review</Link>
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
                    <th>Organization</th>
                    <th>Type</th>
                    <th>City</th>
                    <th>Verification</th>
                    <th>Action</th>
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
                          {o.verified ? "Revoke verification" : "Verify"}
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
                    <th>User</th>
                    <th>Role</th>
                    <th>Organization</th>
                    <th>Status</th>
                    <th>Action</th>
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
                      <td>{u.active ? "Active" : "Deactivated"}</td>
                      <td>
                        {u.role !== "ADMIN" && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={busy}
                            onClick={() => update("users", { id: u.id, active: !u.active })}
                          >
                            {u.active ? "Deactivate" : "Reactivate"}
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
                    <th>Action</th>
                    <th>Actor</th>
                    <th>Entity</th>
                    <th>Change</th>
                    <th>When</th>
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
                      <td>{date(l.createdAt)}</td>
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
