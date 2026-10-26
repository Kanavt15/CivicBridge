"use client";
import { Select, Input, Textarea } from "@/components/localized-fields";

import { Suspense, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { usePlatformRouter as useRouter } from "@/components/app-context";
import { useSession } from "next-auth/react";
import Link from "@/components/localized-fields";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { api, useData } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Breadcrumbs, Loading, Empty, ErrorState } from "@/components/common";
import { UploadField } from "@/components/upload-field";
import { StepProgress, WizardActions, stepValid } from "@/components/form-steps";
import { Text, useI18n } from "@/components/i18n";
function SolutionForm() {
  const params = useSearchParams(),
    router = useRouter();
  const { data: session, status } = useSession();
  const { t } = useI18n();
  const requested = params.get("problem");
  const {
    data: problemData,
    loading: problemsLoading,
    error: problemsError,
    reload: reloadProblems,
  } = useData(requested ? "problems/" + encodeURIComponent(requested) : "problems?status=OPEN");
  const { data: teams } = useData("teams");
  const choices = requested
    ? problemData?.status === "OPEN"
      ? [problemData]
      : []
    : (problemData?.items ?? []);
  const form = useRef<HTMLFormElement>(null);
  const [problemId, setProblemId] = useState(requested ?? ""),
    [step, setStep] = useState(0),
    [uploading, setUploading] = useState(false),
    [files, setFiles] = useState<{ id: string; name: string }[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  function next() {
    if (stepValid(form.current, step)) setStep((s) => Math.min(2, s + 1));
  }
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (step < 2) {
      next();
      return;
    }
    for (let s = 0; s < 3; s++) {
      if (!stepValid(form.current, s)) {
        setStep(s);
        return;
      }
    }
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget),
      input = Object.fromEntries(f);
    try {
      const p = await api("proposals", "POST", {
        ...input,
        teamId: input.teamId || undefined,
        imageIds: files.map((f) => f.id),
      });
      toast.success(t("Proposal submitted for review."));
      router.push("/innovations/" + p.id);
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
        title="Share your solution"
        description="Sign in with a researcher or institution account to submit your solution."
        action={
          <Button asChild>
            <Link href="/login">
              <Text>Sign in</Text>
            </Link>
          </Button>
        }
      />
    );
  // A requested value has no matching <option> until the request completes.
  // Wait before mounting editable fields so an early Continue never validates
  // a temporary empty selection (or loses typed input when data arrives).
  if (problemsLoading) return <Loading />;
  if (problemsError) return <ErrorState error={problemsError} retry={reloadProblems} />;
  if (!choices.length)
    return (
      <Empty
        title="Choose an open challenge"
        description="Find a problem you can help solve."
        action={
          <Button asChild>
            <Link href="/explore">
              <Text>Explore problems</Text>
            </Link>
          </Button>
        }
      />
    );
  return (
    <div className="container page-wrap wizard-wrap">
      <Breadcrumbs
        items={[{ label: "Solutions", href: "/innovations" }, { label: "Propose a solution" }]}
      />
      <div className="wizard-heading">
        <div>
          <h1>
            <Text>Share your solution</Text>
          </h1>
          <p>
            <Text>Start with a clear idea. Add a practical plan.</Text>
          </p>
        </div>
      </div>
      <form className="form-card" noValidate onSubmit={submit} ref={form}>
        <StepProgress step={step} labels={["Your idea", "The plan", "Review"]} />
        {error && (
          <div className="form-message" role="alert">
            <Text>{error}</Text>
          </div>
        )}
        <fieldset className="wizard-fieldset" data-step="0" hidden={step !== 0}>
          <div className="form-grid">
            <label className="field full">
              <Text>Challenge to address</Text>
              <Select
                name="problemId"
                required
                value={problemId}
                onChange={(e) => setProblemId(e.target.value)}
              >
                <option value="">
                  <Text>Choose an open challenge</Text>
                </option>
                {choices.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </Select>
            </label>
            <label className="field full">
              <Text>Solution title</Text>
              <Input name="title" minLength={10} maxLength={160} required />
            </label>
            <label className="field full">
              <Text>Your proposed approach</Text>
              <Textarea name="approach" minLength={40} maxLength={16000} required rows={6} />
            </label>
          </div>
        </fieldset>
        <fieldset className="wizard-fieldset" data-step="1" hidden={step !== 1}>
          <div className="form-grid">
            {[
              ["techStack", "Technology and methods", 3, 1000],
              ["feasibility", "Feasibility and implementation", 20, 5000],
              ["resources", "Resources needed", 10, 3000],
            ].map(([name, text, min, max]) => (
              <label className="field full" key={name}>
                <Text>{text}</Text>
                <Textarea
                  name={String(name)}
                  minLength={Number(min)}
                  maxLength={Number(max)}
                  rows={3}
                  required
                />
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="wizard-fieldset" data-step="2" hidden={step !== 2}>
          <div className="form-grid">
            <label className="field full">
              <Text>Expected impact</Text>
              <Textarea name="impact" minLength={20} maxLength={5000} rows={4} required />
            </label>
            <label className="field full">
              <Text>Innovation team</Text>
              <Select name="teamId" defaultValue="">
                <option value="">
                  <Text>Individual proposal</Text>
                </option>
                {teams
                  ?.filter((team: any) =>
                    team.members.some((m: any) => m.userId === session.user.id && m.accepted),
                  )
                  .map((team: any) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
              </Select>
            </label>
            <div className="field full">
              <span>
                <Text>Supporting documentation (optional)</Text>
              </span>
              <UploadField
                files={files}
                onChange={setFiles}
                documents
                onBusyChange={setUploading}
              />
            </div>
          </div>
          <div className="wizard-notice">
            <ShieldCheck size={17} />
            <Text>All proposals are reviewed before approval.</Text>
          </div>
        </fieldset>
        <WizardActions
          step={step}
          onNext={next}
          onBack={() => setStep((s) => Math.max(0, s - 1))}
          busy={busy || uploading}
          submitLabel="Submit proposal"
        />
      </form>
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
