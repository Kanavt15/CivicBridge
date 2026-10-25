"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { Users, Plus, ShieldCheck, Mail } from "lucide-react";
import { toast } from "sonner";
import { api, useData } from "@/lib/client";
import { initials } from "@/lib/utils";
import { PageIntro, Loading, ErrorState, Empty, DemoBadge, Badge } from "@/components/common";
import { Button } from "@/components/ui/button";
export default function Teams() {
  const { data: teams, error, loading, reload } = useData("teams");
  const { data: session } = useSession();
  const [creating, setCreating] = useState(false),
    [busy, setBusy] = useState(false);
  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await api("teams", "POST", Object.fromEntries(f));
      toast.success("Your team is ready.");
      setCreating(false);
      await reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function action(id: string, path: string, data?: any) {
    setBusy(true);
    try {
      await api(`teams/${id}/${path}`, path === "verify" ? "PATCH" : "POST", data);
      toast.success(
        path === "accept"
          ? "Welcome to the team."
          : path === "verify"
            ? "Team verified."
            : "Invitation sent in-app.",
      );
      await reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="container page-wrap">
      <PageIntro
        eyebrow="Different strengths. A shared purpose."
        title="Good work starts with a good team."
        description="Build your innovation team, invite collaborators, and connect your ideas to a shared mission."
        action={
          session && ["RESEARCHER", "INSTITUTION", "ADMIN"].includes(session.user.role) ? (
            <Button onClick={() => setCreating(!creating)}>
              <Plus size={16} />
              {creating ? "Close form" : "Create a team"}
            </Button>
          ) : undefined
        }
      />
      {creating && (
        <form className="form-card form-stack" style={{ marginBottom: 25 }} onSubmit={create}>
          <h2>Give your team a beginning</h2>
          <label className="field">
            Team name
            <input
              name="name"
              minLength={3}
              maxLength={100}
              required
              placeholder="Your team name"
            />
          </label>
          <label className="field">
            Your shared mission
            <textarea
              name="description"
              minLength={20}
              maxLength={2000}
              required
              placeholder="What brings your team together?"
            />
          </label>
          <Button type="submit" disabled={busy}>
            Create team
          </Button>
        </form>
      )}
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} retry={reload} />
      ) : !teams?.length ? (
        <Empty
          title="Find your people"
          description="Create a team or ask an existing team lead to invite your registered email address. Invitations appear here."
        />
      ) : (
        <div className="team-grid">
          {teams.map((t: any) => {
            const me = t.members.find((m: any) => m.userId === session?.user.id);
            const canVerify =
              session?.user.role === "ADMIN" || session?.user.role === "INSTITUTION";
            return (
              <article className="team-card" key={t.id}>
                <div className="detail-badges">
                  <span className="mini-icon teal">
                    <Users size={19} />
                  </span>
                  {t.verified && (
                    <Badge type="approved">
                      <ShieldCheck size={12} />
                      Verified team
                    </Badge>
                  )}
                  {t.isDemo && <DemoBadge />}
                  {me && !me.accepted && <Badge type="pending">Invitation pending</Badge>}
                </div>
                <h3>{t.name}</h3>
                <p>{t.description}</p>
                {t.organization && (
                  <small className="muted">
                    {t.organization.name} · {t._count.proposals} proposals
                  </small>
                )}
                <div className="space-top">
                  {t.members.map((m: any) => (
                    <div className="member-row" key={m.id}>
                      <span className="avatar">{initials(m.user.name)}</span>
                      <span>{m.user.name}</span>
                      <small>
                        {!m.accepted ? "Invited" : m.role === "LEAD" ? "Team lead" : "Member"}
                      </small>
                    </div>
                  ))}
                </div>
                {me && !me.accepted && (
                  <Button
                    className="space-top"
                    disabled={busy}
                    onClick={() => action(t.id, "accept")}
                  >
                    Accept invitation
                  </Button>
                )}
                {me?.role === "LEAD" && me.accepted && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const email = new FormData(e.currentTarget).get("email");
                      void action(t.id, "invite", { email });
                      e.currentTarget.reset();
                    }}
                  >
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="Member’s registered email"
                      aria-label={`Invite a member to ${t.name}`}
                    />
                    <Button type="submit" variant="outline" disabled={busy}>
                      <Mail size={14} />
                      Invite
                    </Button>
                  </form>
                )}
                {canVerify && !t.verified && (
                  <Button
                    variant="outline"
                    className="space-top"
                    disabled={busy}
                    onClick={() => action(t.id, "verify")}
                  >
                    <ShieldCheck size={15} />
                    Verify team
                  </Button>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
