"use client";
import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Send, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { api, useData } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Breadcrumbs, PageIntro, Loading, Empty } from "@/components/common";
import { UploadField } from "@/components/upload-field";
function SolutionForm() {
  const params = useSearchParams(),
    router = useRouter();
  const { data: session, status } = useSession();
  const { data: problems } = useData("problems?status=OPEN");
  const { data: teams } = useData("teams");
  const [files, setFiles] = useState<{ id: string; name: string }[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      const input = Object.fromEntries(f);
      const p = await api("proposals", "POST", {
        ...input,
        teamId: input.teamId || undefined,
        imageIds: files.map((f) => f.id),
      });
      toast.success("Proposal submitted for review.");
      router.push(`/innovations/${p.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (status === "loading") return <Loading />;
  if (!session || !["RESEARCHER", "INSTITUTION", "ADMIN"].includes(session.user.role))
    return (
      <Empty
        title="Great ideas need curious minds"
        description="Sign in with a researcher or institution account to submit your solution."
        action={
          <Button asChild>
            <Link href="/login">Sign in</Link>
          </Button>
        }
      />
    );
  return (
    <div className="container page-wrap">
      <Breadcrumbs
        items={[{ label: "Innovations", href: "/innovations" }, { label: "Propose a solution" }]}
      />
      <PageIntro
        eyebrow="An idea with a purpose"
        title="How would you solve it?"
        description="Bring a thoughtful, practical approach to a real community challenge. Every breakthrough starts with a proposal."
      />
      <div className="two-col">
        <form className="form-card" onSubmit={submit}>
          <h2>Your innovation proposal</h2>
          <p>Help reviewers understand the idea, its feasibility, and the people behind it.</p>
          {error && (
            <div className="form-message" role="alert">
              {error}
            </div>
          )}
          <div className="form-grid">
            <label className="field full">
              Challenge to address
              {params.get("problem") ? (
                <input name="problemId" defaultValue={params.get("problem")!} readOnly />
              ) : (
                <select name="problemId" required defaultValue="">
                  <option value="">Choose an open challenge</option>
                  {problems?.items.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              )}
            </label>
            <label className="field full">
              Solution title
              <input
                name="title"
                minLength={10}
                maxLength={160}
                required
                placeholder="A clear name for your idea"
              />
            </label>
            {[
              [
                "approach",
                "Your proposed approach",
                40,
                "What will you build, and how does it address the problem?",
              ],
              [
                "techStack",
                "Technology and methods",
                3,
                "Tools, technologies, or research methods you will use",
              ],
              ["impact", "Expected impact", 20, "Who benefits? How will you measure the results?"],
              [
                "feasibility",
                "Feasibility and implementation",
                20,
                "What makes this practical? Include risks and a realistic plan.",
              ],
              [
                "resources",
                "Resources needed",
                10,
                "Mentorship, equipment, expertise, or other support",
              ],
            ].map(([name, text, min, placeholder]) => (
              <label className="field full" key={name}>
                {text}
                <textarea
                  name={String(name)}
                  minLength={Number(min)}
                  maxLength={
                    name === "approach"
                      ? 16000
                      : name === "techStack"
                        ? 1000
                        : name === "resources"
                          ? 3000
                          : 5000
                  }
                  required
                  rows={name === "approach" ? 5 : 3}
                  placeholder={String(placeholder)}
                />
              </label>
            ))}
            <label className="field full">
              Innovation team
              <select name="teamId" defaultValue="">
                <option value="">Individual proposal</option>
                {teams
                  ?.filter((t: any) =>
                    t.members.some((m: any) => m.userId === session.user.id && m.accepted),
                  )
                  .map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
              </select>
              <small>
                <Link className="text-link" href="/teams">
                  Create or manage your teams
                </Link>
              </small>
            </label>
            <div className="field full">
              <span>Supporting documentation (optional)</span>
              <UploadField files={files} onChange={setFiles} documents />
            </div>
          </div>
          <div className="form-actions">
            <Button type="submit" disabled={busy}>
              <Send size={16} />
              {busy ? "Submitting…" : "Submit proposal"}
            </Button>
          </div>
        </form>
        <aside className="side-stack">
          <div className="info-box">
            <Lightbulb size={23} />
            <h4 className="space-top">Make the idea actionable.</h4>
            <p>
              Practical proposals describe a specific pilot, measurable outcomes, realistic
              resources, and a maintenance plan.
            </p>
          </div>
          <div className="side-card">
            <h3>Your proposal journey</h3>
            <p>
              Submitted → Under review → Shortlisted → Approved → Pilot implementation → Completed
            </p>
            <p className="space-top">
              Approved proposals receive a private collaboration workspace where teams and partners
              can build together.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <SolutionForm />
    </Suspense>
  );
}
