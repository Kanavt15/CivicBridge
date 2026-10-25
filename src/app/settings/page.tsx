"use client";
import { useState } from "react";
import Link from "next/link";
import { Save, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { api, useData } from "@/lib/client";
import { categories } from "@/lib/domain";
import { PageIntro, Loading, ErrorState } from "@/components/common";
import { Button } from "@/components/ui/button";
export default function Settings() {
  const { data: u, error, loading, reload } = useData("me");
  const [busy, setBusy] = useState(false);
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await api("profile", "PATCH", {
        name: f.get("name"),
        bio: f.get("bio"),
        skills: String(f.get("skills"))
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        interests: f.getAll("interests"),
      });
      toast.success("Profile updated. Matching will use your new preferences.");
      await reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (loading) return <Loading />;
  if (error || !u)
    return <ErrorState error={error || "Sign in to edit your profile."} retry={reload} />;
  return (
    <div className="container page-wrap">
      <PageIntro
        eyebrow="Your perspective. Your strengths."
        title="Make your profile yours."
        description="Help people discover your expertise, and get challenge recommendations that match your interests."
        action={
          <Button asChild variant="outline">
            <Link href={`/people/${u.id}`}>
              View public profile <ArrowUpRight size={15} />
            </Link>
          </Button>
        }
      />
      <div className="two-col">
        <form className="form-card form-stack" onSubmit={save}>
          <label className="field">
            Display name
            <input name="name" defaultValue={u.name} required minLength={2} maxLength={80} />
          </label>
          <label className="field">
            About you
            <textarea
              name="bio"
              defaultValue={u.bio}
              maxLength={2000}
              placeholder="What motivates you? What are you working on?"
            />
          </label>
          <label className="field">
            Skills
            <input
              name="skills"
              defaultValue={u.skills.join(", ")}
              placeholder="IoT, water, sensors, education"
            />
            <small>
              Comma-separated, up to 20 skills. These help match you with relevant challenges.
            </small>
          </label>
          <fieldset style={{ border: 0, padding: 0 }}>
            <legend style={{ fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
              Categories you care about
            </legend>
            <div className="field-checks">
              {categories.map((c) => (
                <label key={c}>
                  <input
                    type="checkbox"
                    name="interests"
                    value={c}
                    defaultChecked={u.interests.includes(c)}
                  />
                  {c}
                </label>
              ))}
            </div>
          </fieldset>
          <Button type="submit" disabled={busy}>
            <Save size={16} />
            {busy ? "Saving…" : "Save profile"}
          </Button>
        </form>
        <aside className="side-stack">
          <div className="side-card">
            <h3>Your privacy, respected.</h3>
            <p>
              Your email address is used for signing in and team invitations. Public profiles show
              your display name, skills, organization, achievements, and approved innovation
              portfolio.
            </p>
          </div>
          <div className="side-card">
            <h3>Account</h3>
            <div className="side-row">
              <span>Email</span>
              <span style={{ fontSize: 10, overflowWrap: "anywhere" }}>{u.email}</span>
            </div>
            <div className="side-row">
              <span>Role</span>
              <strong>{u.role.toLowerCase()}</strong>
            </div>
            <div className="side-row">
              <span>Organization</span>
              <span>{u.organization?.name || "Independent"}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
