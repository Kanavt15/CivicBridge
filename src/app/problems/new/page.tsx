"use client";
import { Input, Textarea, Select } from "@/components/localized-fields";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "@/components/localized-fields";
import { useSession } from "next-auth/react";
import { LocateFixed, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/client";
import { categories } from "@/lib/domain";
import { Breadcrumbs, Empty, Loading } from "@/components/common";
import { Button } from "@/components/ui/button";
import { MapView } from "@/components/map";
import { UploadField } from "@/components/upload-field";
import { StepProgress, WizardActions, stepValid } from "@/components/form-steps";
import { Text, useI18n } from "@/components/i18n";
export default function Report() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { t } = useI18n();
  const form = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(0),
    [uploading, setUploading] = useState(false),
    [title, setTitle] = useState(""),
    [description, setDescription] = useState(""),
    [category, setCategory] = useState(""),
    [urgency, setUrgency] = useState("MEDIUM"),
    [position, setPosition] = useState<[number, number]>([19.076, 72.8777]),
    [files, setFiles] = useState<{ id: string; name: string }[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [assist, setAssist] = useState<any>(null),
    [helping, setHelping] = useState(false),
    [locating, setLocating] = useState(false),
    [locationNote, setLocationNote] = useState("");
  function next() {
    if (stepValid(form.current, step)) setStep((s) => Math.min(2, s + 1));
  }
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
      toast.error(t((e as Error).message));
    } finally {
      setHelping(false);
    }
  }
  function locate() {
    if (!navigator.geolocation) {
      setLocationNote("Location unavailable. Set the pin manually.");
      return;
    }
    setLocating(true);
    setLocationNote("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false);
        if (
          coords.latitude < 6 ||
          coords.latitude > 38 ||
          coords.longitude < 68 ||
          coords.longitude > 98
        ) {
          setLocationNote("Choose a location within India.");
          return;
        }
        setPosition([coords.latitude, coords.longitude]);
        setLocationNote("Location updated. Check the pin and locality.");
      },
      () => {
        setLocating(false);
        setLocationNote("Location unavailable. Set the pin manually.");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  }
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (step < 2) {
      next();
      return;
    }
    if (![0, 1, 2].every((s) => stepValid(form.current, s))) return;
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
      toast.success(t("Report submitted."));
      router.push("/problems/" + p.id);
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
        title="Sign in to your community."
        description="Create a citizen account to report a local problem."
        action={
          <Button asChild>
            <Link href="/login">
              <Text>Sign in</Text>
            </Link>
          </Button>
        }
      />
    );
  if (!["CITIZEN", "ADMIN"].includes(session.user.role))
    return (
      <Empty
        title="Find a problem"
        description="Citizen accounts report problems. Use your expertise to propose a solution."
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
      <Breadcrumbs items={[{ label: "Problems", href: "/explore" }, { label: "Post a problem" }]} />
      <div className="wizard-heading">
        <div>
          <h1>
            <Text>Describe the problem</Text>
          </h1>
          <p>
            <Text>A few clear details help the right people respond.</Text>
          </p>
        </div>
      </div>
      <form className="form-card" noValidate onSubmit={submit} ref={form}>
        <StepProgress step={step} labels={["Problem", "Location", "Review"]} />
        {error && (
          <div className="form-message" role="alert">
            <Text>{error}</Text>
          </div>
        )}
        <fieldset className="wizard-fieldset" data-step="0" hidden={step !== 0}>
          <div className="form-grid">
            <label className="field full">
              <Text>Problem title</Text>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                minLength={12}
                maxLength={160}
                required
                placeholder="A short, specific title"
              />
            </label>
            <label className="field full">
              <Text>What’s happening?</Text>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                minLength={40}
                maxLength={12000}
                rows={5}
                required
                placeholder="Explain the issue and who it affects."
              />
              <small>
                <Text>Keep personal contact details out of your report.</Text>
              </small>
            </label>
            <label className="field">
              <Text>Category</Text>
              <Select
                aria-label="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="">
                  <Text>Choose a category</Text>
                </option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    <Text>{c}</Text>
                  </option>
                ))}
              </Select>
            </label>
            <label className="field">
              <Text>Urgency</Text>
              <Select value={urgency} onChange={(e) => setUrgency(e.target.value)}>
                {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((v) => (
                  <option key={v} value={v}>
                    <Text>{v[0] + v.slice(1).toLowerCase()}</Text>
                  </option>
                ))}
              </Select>
            </label>
          </div>
          <details className="compact-details">
            <summary>
              <Text>Suggest category & find similar reports</Text>
            </summary>
            <p>
              <Text>
                Suggestions need your review. A configured AI provider may receive this text.
              </Text>
            </p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={description.length < 20 || helping}
              onClick={help}
            >
              <Sparkles size={14} />
              <Text>{helping ? "Analyzing…" : "Suggest category & find similar reports"}</Text>
            </Button>
            {assist && (
              <div className="assist-box">
                <h4>
                  <Text>{assist.suggestion.source}</Text>
                </h4>
                <p>
                  <Text>{assist.suggestion.explanation}</Text>
                </p>
                <p>
                  <Text>{assist.suggestion.category}</Text>
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
                  <Text>Apply suggestion</Text>
                </Button>
                {assist.duplicates.length > 0 && (
                  <>
                    <p>
                      <Text>Similar reports</Text>
                    </p>
                    {assist.duplicates.map((p: any) => (
                      <p key={p.id}>
                        <Link href={"/problems/" + p.id} target="_blank">
                          {p.title}
                        </Link>
                      </p>
                    ))}
                  </>
                )}
              </div>
            )}
          </details>
        </fieldset>
        <fieldset className="wizard-fieldset" data-step="1" hidden={step !== 1}>
          <h2>
            <Text>Where is the problem?</Text>
          </h2>
          <div className="form-grid">
            <label className="field">
              <Text>State / union territory</Text>
              <Input name="state" minLength={2} maxLength={80} required />
            </label>
            <label className="field">
              <Text>City / village</Text>
              <Input name="city" minLength={2} maxLength={80} required />
            </label>
            <label className="field">
              <Text>Area / locality</Text>
              <Input name="area" minLength={2} maxLength={150} required />
            </label>
            <label className="field">
              <Text>Estimated people affected</Text>
              <Input
                name="population"
                type="number"
                min={1}
                max={100000000}
                defaultValue={100}
                required
              />
            </label>
            <div className="field full">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={locating}
                onClick={locate}
              >
                <LocateFixed size={16} />
                <Text>{locating ? "Finding your location…" : "Use my current location"}</Text>
              </Button>
              {locationNote && (
                <p className="map-hint" role="status">
                  <Text>{locationNote}</Text>
                </p>
              )}
              {step === 1 && <MapView value={position} onChange={setPosition} />}
              <p className="map-hint">
                <Text>Check the pin. The starting location is Mumbai.</Text>
              </p>
            </div>
            <label className="field">
              <Text>Latitude</Text>
              <Input
                type="number"
                step="any"
                min={6}
                max={38}
                required
                value={position[0]}
                onChange={(e) => setPosition([Number(e.target.value), position[1]])}
              />
            </label>
            <label className="field">
              <Text>Longitude</Text>
              <Input
                type="number"
                step="any"
                min={68}
                max={98}
                required
                value={position[1]}
                onChange={(e) => setPosition([position[0], Number(e.target.value)])}
              />
            </label>
          </div>
        </fieldset>
        <fieldset className="wizard-fieldset" data-step="2" hidden={step !== 2}>
          <h2>
            <Text>Review your report</Text>
          </h2>
          <div className="wizard-summary">
            <small>
              <Text>{category}</Text>
            </small>
            <h3>{title}</h3>
            <p>{description}</p>
            <small>
              {position[0]}, {position[1]}
            </small>
          </div>
          <div className="field">
            <span>
              <Text>Images (optional)</Text>
            </span>
            <UploadField files={files} onChange={setFiles} onBusyChange={setUploading} />
          </div>
          <div className="wizard-notice">
            <ShieldCheck size={17} />
            <Text>Your report is reviewed before it becomes public.</Text>
          </div>
        </fieldset>
        <WizardActions
          step={step}
          onNext={next}
          onBack={() => setStep((s) => Math.max(0, s - 1))}
          busy={busy || uploading}
          submitLabel="Submit report"
        />
      </form>
    </div>
  );
}
