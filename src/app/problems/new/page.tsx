"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, Send, ShieldCheck, MapPin } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { api } from "@/lib/client";
import { categories } from "@/lib/domain";
import { Breadcrumbs, PageIntro, Empty, Loading } from "@/components/common";
import { Button } from "@/components/ui/button";
import { MapView } from "@/components/map";
import { UploadField } from "@/components/upload-field";
export default function Report() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [category, setCategory] = useState(""),
    [urgency, setUrgency] = useState("MEDIUM"),
    [description, setDescription] = useState(""),
    [title, setTitle] = useState(""),
    [position, setPosition] = useState<[number, number]>([19.076, 72.8777]),
    [files, setFiles] = useState<{ id: string; name: string }[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [assist, setAssist] = useState<any>(null),
    [helping, setHelping] = useState(false);
  async function help() {
    setHelping(true);
    try {
      setAssist(
        await api("assist", "POST", {
          text: title + " " + description,
          latitude: position[0],
          longitude: position[1],
        }),
      );
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setHelping(false);
    }
  }
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      const p = await api("problems", "POST", {
        title,
        description,
        category,
        urgency,
        state: f.get("state"),
        city: f.get("city"),
        area: f.get("area"),
        latitude: position[0],
        longitude: position[1],
        population: Number(f.get("population")),
        imageIds: files.map((f) => f.id),
      });
      toast.success(`Report submitted. Your reference is ${p.id}.`);
      router.push(`/problems/${p.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (status === "loading") return <Loading />;
  if (!session)
    return (
      <Empty
        title="Your community’s voice starts with you"
        description="Sign in or create a citizen account to report a local problem."
        action={
          <Button asChild>
            <Link href="/login">Sign in to report</Link>
          </Button>
        }
      />
    );
  if (!["CITIZEN", "ADMIN"].includes(session.user.role))
    return (
      <Empty
        title="Bring your expertise to a challenge"
        description="Reporting is available to citizen accounts. Your account can explore challenges and contribute through solutions or collaboration."
        action={
          <Button asChild>
            <Link href="/explore">Explore challenges</Link>
          </Button>
        }
      />
    );
  return (
    <div className="container page-wrap">
      <Breadcrumbs
        items={[{ label: "Challenges", href: "/explore" }, { label: "Report a problem" }]}
      />
      <PageIntro
        eyebrow="A local voice. A collective opportunity."
        title="What needs to change?"
        description="Tell us what’s happening in your community. Help the right people understand the problem and start working on a solution."
      />
      <div className="two-col">
        <form className="form-card" onSubmit={submit}>
          <h2>Make the challenge clear</h2>
          <p>The more context you share, the better we can work together.</p>
          {error && (
            <div className="form-message" role="alert">
              {error}
            </div>
          )}
          <div className="form-grid">
            <label className="field full">
              Problem title
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                minLength={12}
                maxLength={160}
                required
                placeholder="For example, unreliable drinking water in our village"
              />
            </label>
            <label className="field full">
              What’s happening?
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                minLength={40}
                maxLength={12000}
                rows={5}
                required
                placeholder="Describe the issue, who it affects, and what has been tried so far."
              />
              <small>
                At least 40 characters. Keep personal contact information out of your report.
              </small>
              <small>
                Assistance uses local rules by default. If an AI provider is configured, clicking
                below sends this title and description to that provider for editable suggestions.
              </small>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={description.length < 20 || helping}
                onClick={help}
              >
                <Sparkles size={14} />
                {helping ? "Analyzing…" : "Suggest category & find similar reports"}
              </Button>
              {assist && (
                <div className="ai-box">
                  <h4>
                    <Sparkles size={15} />
                    {assist.suggestion.source}
                  </h4>
                  <p>{assist.suggestion.explanation}</p>
                  <p>
                    Suggested: <strong>{assist.suggestion.category}</strong> ·{" "}
                    <strong>{assist.suggestion.urgency.toLowerCase()}</strong> urgency
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCategory(assist.suggestion.category);
                      setUrgency(assist.suggestion.urgency);
                    }}
                  >
                    Apply suggestion
                  </Button>
                  <p>
                    Potential duplicates:{" "}
                    {assist.duplicates.length === 0
                      ? "No similar nearby public reports found."
                      : "Review these before reporting:"}
                  </p>
                  {assist.duplicates.map((p: any) => (
                    <Link key={p.id} href={`/problems/${p.id}`} target="_blank">
                      {p.title} · {p.city}
                      {p.distance !== null ? ` · ${Math.round(p.distance)} km away` : ""}
                    </Link>
                  ))}
                </div>
              )}
            </label>
            <label className="field">
              Category
              <select value={category} onChange={(e) => setCategory(e.target.value)} required>
                <option value="">Choose a category</option>
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="field">
              Urgency
              <select value={urgency} onChange={(e) => setUrgency(e.target.value)}>
                {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((v) => (
                  <option key={v} value={v}>
                    {v.toLowerCase()}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              State / union territory
              <input name="state" required minLength={2} maxLength={80} placeholder="Maharashtra" />
            </label>
            <label className="field">
              City / village
              <input name="city" required minLength={2} maxLength={80} placeholder="Mumbai" />
            </label>
            <label className="field">
              Area / locality
              <input
                name="area"
                required
                minLength={2}
                maxLength={150}
                placeholder="Locality or nearest landmark"
              />
            </label>
            <label className="field">
              Estimated people affected
              <input
                type="number"
                name="population"
                min={1}
                max={100000000}
                defaultValue={100}
                required
              />
            </label>
            <div className="field full">
              <span>Pin the location</span>
              <MapView value={position} onChange={setPosition} />
              <p className="map-hint">
                Click the map to set your location, or enter coordinates below. The initial pin is
                Mumbai; adjust it to your report.
              </p>
              <div className="form-grid">
                <label className="field">
                  Latitude
                  <input
                    type="number"
                    step="any"
                    min={6}
                    max={38}
                    value={position[0]}
                    onChange={(e) => setPosition([Number(e.target.value), position[1]])}
                    required
                  />
                </label>
                <label className="field">
                  Longitude
                  <input
                    type="number"
                    step="any"
                    min={68}
                    max={98}
                    value={position[1]}
                    onChange={(e) => setPosition([position[0], Number(e.target.value)])}
                    required
                  />
                </label>
              </div>
            </div>
            <div className="field full">
              <span>Images (optional)</span>
              <UploadField files={files} onChange={setFiles} />
            </div>
          </div>
          <div className="form-actions">
            <Button asChild variant="ghost">
              <Link href="/explore">Cancel</Link>
            </Button>
            <Button type="submit" disabled={busy}>
              <Send size={16} />
              {busy ? "Submitting…" : "Submit report"}
            </Button>
          </div>
        </form>
        <aside className="side-stack">
          <div className="side-card">
            <ShieldCheck size={26} className="muted" />
            <h3 className="space-top">Every voice deserves care.</h3>
            <p>
              Your report will be reviewed before it becomes public. Your email and private account
              details stay private.
            </p>
          </div>
          <div className="info-box">
            <h4>A helpful report includes</h4>
            <ul>
              <li>A specific, descriptive title</li>
              <li>Who is affected and how</li>
              <li>A precise location</li>
              <li>Clear images if available</li>
              <li>Context, without personal details</li>
            </ul>
          </div>
          <div className="side-card">
            <h3>What happens next?</h3>
            <p>Report → Review → Open for solutions → Collaboration → Pilot → Resolved</p>
            <p className="space-top">
              You’ll receive an in-app notification when your report moves forward.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
