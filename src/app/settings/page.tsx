"use client";
import { Input, Textarea } from "@/components/localized-fields";
import { Text } from "@/components/i18n";

import { useState } from "react";
import Link from "@/components/localized-fields";
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
              <Text>{"View public profile"}</Text>
              <ArrowUpRight size={15} />
            </Link>
          </Button>
        }
      />
      <div className="two-col">
        <form className="form-card form-stack" onSubmit={save}>
          <label className="field">
            <Text>{"Display name"}</Text>
            <Input name="name" defaultValue={u.name} required minLength={2} maxLength={80} />
          </label>
          <label className="field">
            <Text>{"About you"}</Text>
            <Textarea
              name="bio"
              defaultValue={u.bio}
              maxLength={2000}
              placeholder="What motivates you? What are you working on?"
            />
          </label>
          <label className="field">
            <Text>{"Skills"}</Text>
            <Input
              name="skills"
              defaultValue={u.skills.join(", ")}
              placeholder="IoT, water, sensors, education"
            />
            <small>
              <Text>
                {"Comma-separated, up to 20 skills. These help match you with relevant challenges."}
              </Text>
            </small>
          </label>
          <fieldset style={{ border: 0, padding: 0 }}>
            <legend style={{ fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
              <Text>{"Categories you care about"}</Text>
            </legend>
            <div className="field-checks">
              {categories.map((c) => (
                <label key={c}>
                  <Input
                    type="checkbox"
                    name="interests"
                    value={c}
                    defaultChecked={u.interests.includes(c)}
                  />
                  <Text>{c}</Text>
                </label>
              ))}
            </div>
          </fieldset>
          <Button type="submit" disabled={busy}>
            <Save size={16} />
            <Text>{busy ? "Saving…" : "Save profile"}</Text>
          </Button>
        </form>
        <aside className="side-stack">
          <div className="side-card">
            <h3>
              <Text>{"Your privacy, respected."}</Text>
            </h3>
            <p>
              <Text>
                {
                  "Your email address is used for signing in and team invitations. Public profiles show your display name, skills, organization, achievements, and approved innovation portfolio."
                }
              </Text>
            </p>
          </div>
          <div className="side-card">
            <h3>
              <Text>{"Account"}</Text>
            </h3>
            <div className="side-row">
              <span>
                <Text>{"Email"}</Text>
              </span>
              <span style={{ fontSize: 10, overflowWrap: "anywhere" }}>{u.email}</span>
            </div>
            <div className="side-row">
              <span>
                <Text>{"Role"}</Text>
              </span>
              <strong>{u.role.toLowerCase()}</strong>
            </div>
            <div className="side-row">
              <span>
                <Text>{"Organization"}</Text>
              </span>
              <span>{u.organization?.name || "Independent"}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
