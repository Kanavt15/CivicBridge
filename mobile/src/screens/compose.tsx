import { useLocalSearchParams } from "expo-router";
import { useAppNavigation } from "../lib/navigation";
import { useState } from "react";
import { Text, View } from "react-native";
import * as Location from "expo-location";
import { LocateFixed, Sparkles } from "lucide-react-native";
import { problemSchema, proposalSchema } from "../../../src/lib/validation";
import { categories } from "../../../src/lib/domain";
import { useAuth } from "../providers";
import { useResource } from "../lib/resource";
import { platform } from "../lib/api";
import { Attachments, type Attachment } from "../components/attachments";
import { Button, colors, Empty, ErrorView, Field, Loading, Screen, Select, T, ui } from "../ui";

function Steps({ step, labels }: { step: number; labels: string[] }) {
  return (
    <View style={{ flexDirection: "row", gap: 10, marginBottom: 24 }}>
      {labels.map((label, i) => (
        <View style={{ flex: 1, gap: 7 }} key={label}>
          <View
            style={{
              height: 3,
              borderRadius: 3,
              backgroundColor: i <= step ? colors.ink : colors.border,
            }}
          />
          <T style={{ fontSize: 12, color: i === step ? colors.ink : colors.muted }}>{label}</T>
        </View>
      ))}
    </View>
  );
}
function Actions({
  step,
  back,
  next,
  submit,
  busy,
}: {
  step: number;
  back: () => void;
  next: () => void;
  submit: string;
  busy: boolean;
}) {
  return (
    <View style={[ui.row, { marginTop: 22 }]}>
      {step > 0 ? <Button title="Back" secondary disabled={busy} onPress={back} /> : <View />}
      <Button title={step < 2 ? "Continue" : submit} busy={busy} onPress={next} />
    </View>
  );
}
export function ReportScreen() {
  const navigation = useAppNavigation();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Infrastructure",
    urgency: "MEDIUM",
    state: "",
    city: "",
    area: "",
    latitude: "",
    longitude: "",
    population: "100",
  });
  const [files, setFiles] = useState<Attachment[]>([]);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [helping, setHelping] = useState(false);
  const [suggestion, setSuggestion] = useState<any>(null);
  const [error, setError] = useState("");
  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));
  function input() {
    return {
      ...form,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      population: Number(form.population),
      imageIds: files.map((f) => f.id),
    };
  }
  async function next() {
    if (busy || uploading) return;
    setError("");
    const schema =
      step === 0
        ? problemSchema.pick({ title: true, description: true, category: true, urgency: true })
        : step === 1
          ? problemSchema.omit({
              title: true,
              description: true,
              category: true,
              urgency: true,
              imageIds: true,
            })
          : problemSchema;
    const parsed = schema.safeParse(input());
    if (!parsed.success) {
      setError(parsed.error.issues.map((i) => i.message).join("\n"));
      return;
    }
    if (step < 2) {
      setStep((s) => s + 1);
      return;
    }
    setBusy(true);
    try {
      const result = await platform("problems", "POST", problemSchema.parse(input()));
      navigation.replace("Problem", { id: result.id });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function locate() {
    setLocating(true);
    setError("");
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) throw new Error("Location unavailable. Enter coordinates manually.");
      const result = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setForm((f) => ({
        ...f,
        latitude: result.coords.latitude.toFixed(6),
        longitude: result.coords.longitude.toFixed(6),
      }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLocating(false);
    }
  }
  if (!user || !["CITIZEN", "ADMIN"].includes(user.role))
    return (
      <Screen>
        <Empty title="Sign in to continue." description="Citizens can post local problems." />
        <Button title="Sign in" onPress={() => navigation.navigate("Auth")} />
      </Screen>
    );
  return (
    <Screen>
      <View>
        <T style={ui.title}>Post a problem</T>
        <T style={ui.muted}>A photo. A location. A better starting point.</T>
      </View>
      <View style={ui.card}>
        <Steps step={step} labels={["Problem", "Location", "Review"]} />
        {step === 0 && (
          <>
            <Field
              label="Problem title"
              value={form.title}
              onChangeText={set("title")}
              maxLength={160}
            />
            <Field
              label="What’s happening?"
              value={form.description}
              onChangeText={set("description")}
              maxLength={12000}
              multiline
            />
            <Select
              label="Category"
              value={form.category}
              onChange={set("category")}
              options={categories.map((c) => ({ value: c, label: c }))}
            />
            <Select
              label="Urgency"
              value={form.urgency}
              onChange={set("urgency")}
              options={["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((value) => ({
                value,
                label: value[0] + value.slice(1).toLowerCase(),
              }))}
            />
            <Button
              title="Suggest category & urgency"
              secondary
              busy={helping}
              disabled={form.description.length < 40}
              icon={<Sparkles size={17} />}
              onPress={async () => {
                setHelping(true);
                setError("");
                try {
                  const result = await platform("assist", "POST", {
                    text: form.title + " " + form.description,
                  });
                  setSuggestion(result.suggestion);
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setHelping(false);
                }
              }}
            />
            {suggestion && (
              <View style={{ gap: 12 }}>
                <T style={ui.small}>Review required</T>
                <T>{suggestion.category}</T>
                <Text style={ui.small}>{suggestion.explanation}</Text>
                <Button
                  title="Use suggestion"
                  secondary
                  onPress={() => {
                    setForm((f) => ({
                      ...f,
                      category: suggestion.category,
                      urgency: suggestion.urgency,
                    }));
                    setSuggestion(null);
                  }}
                />
              </View>
            )}
          </>
        )}
        {step === 1 && (
          <>
            <Field
              label="State / union territory"
              value={form.state}
              onChangeText={set("state")}
              maxLength={80}
            />
            <Field
              label="City / village"
              value={form.city}
              onChangeText={set("city")}
              maxLength={80}
            />
            <Field
              label="Area / locality"
              value={form.area}
              onChangeText={set("area")}
              maxLength={150}
            />
            <Button
              title="Use my current location"
              secondary
              busy={locating}
              icon={<LocateFixed size={17} />}
              onPress={locate}
            />
            <T style={ui.small}>Location is used only when you choose it.</T>
            <Field
              label="Latitude"
              value={form.latitude}
              onChangeText={set("latitude")}
              keyboardType="decimal-pad"
              maxLength={12}
            />
            <Field
              label="Longitude"
              value={form.longitude}
              onChangeText={set("longitude")}
              keyboardType="decimal-pad"
              maxLength={12}
            />
            <Field
              label="People affected"
              value={form.population}
              onChangeText={set("population")}
              keyboardType="number-pad"
              maxLength={9}
            />
          </>
        )}
        {step === 2 && (
          <>
            <Text style={ui.sectionTitle}>{form.title}</Text>
            <T>{form.category}</T>
            <Text style={ui.muted}>
              {form.area}, {form.city}
            </Text>
            <Attachments value={files} onChange={setFiles} onBusy={setUploading} />
            <T style={ui.small}>Your report is reviewed before it appears publicly.</T>
          </>
        )}
        {error !== "" && (
          <View accessibilityRole="alert">
            <T>{error}</T>
          </View>
        )}
        <Actions
          step={step}
          back={() => {
            setError("");
            setStep((s) => s - 1);
          }}
          next={next}
          submit="Submit report"
          busy={busy || uploading || locating}
        />
      </View>
    </Screen>
  );
}
export function ProposeScreen() {
  const navigation = useAppNavigation();
  const { user } = useAuth();
  const { problemId: requested } = useLocalSearchParams<{ problemId?: string }>();
  const resource = useResource(
    requested ? `/api/platform/problems/${requested}` : "/api/platform/problems?status=OPEN",
  );
  const choices = requested
    ? resource.data?.status === "OPEN"
      ? [resource.data]
      : []
    : (resource.data?.items ?? []);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    problemId: requested ?? "",
    title: "",
    approach: "",
    techStack: "",
    feasibility: "",
    resources: "",
    impact: "",
  });
  const [files, setFiles] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));
  async function next() {
    if (busy || uploading) return;
    setError("");
    const schema =
      step === 0
        ? proposalSchema.pick({ problemId: true, title: true, approach: true })
        : step === 1
          ? proposalSchema.pick({ techStack: true, feasibility: true, resources: true })
          : proposalSchema;
    const input = { ...form, imageIds: files.map((f) => f.id) };
    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      setError(parsed.error.issues.map((i) => i.message).join("\n"));
      return;
    }
    if (step < 2) {
      setStep((s) => s + 1);
      return;
    }
    setBusy(true);
    try {
      const result = await platform("proposals", "POST", proposalSchema.parse(input));
      navigation.replace("Solution", { id: result.id });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (!user || !["RESEARCHER", "INSTITUTION", "ADMIN"].includes(user.role))
    return (
      <Screen>
        <Empty
          title="Share your solution"
          description="Sign in with a researcher or institution account to submit your solution."
        />
        <Button title="Sign in" onPress={() => navigation.navigate("Auth")} />
      </Screen>
    );
  if (resource.loading) return <Loading />;
  if (resource.error) return <ErrorView message={resource.error} retry={resource.reload} />;
  if (!choices.length)
    return (
      <Screen>
        <Empty title="Choose an open challenge" description="Find a problem you can help solve." />
      </Screen>
    );
  return (
    <Screen>
      <View>
        <T style={ui.title}>Share your solution</T>
        <T style={ui.muted}>Start with a clear idea. Add a practical plan.</T>
      </View>
      <View style={ui.card}>
        <Steps step={step} labels={["Your idea", "The plan", "Review"]} />
        {step === 0 && (
          <>
            <Select
              label="Challenge to address"
              value={form.problemId}
              onChange={set("problemId")}
              options={[
                { value: "", label: "Choose an open challenge" },
                ...choices.map((p: any) => ({ value: p.id, label: p.title, raw: true })),
              ]}
            />
            <Field
              label="Solution title"
              value={form.title}
              onChangeText={set("title")}
              maxLength={160}
            />
            <Field
              label="Your proposed approach"
              value={form.approach}
              onChangeText={set("approach")}
              multiline
              maxLength={16000}
            />
          </>
        )}
        {step === 1 && (
          <>
            <Field
              label="Technology and methods"
              value={form.techStack}
              onChangeText={set("techStack")}
              multiline
              maxLength={1000}
            />
            <Field
              label="Feasibility and implementation"
              value={form.feasibility}
              onChangeText={set("feasibility")}
              multiline
              maxLength={5000}
            />
            <Field
              label="Resources needed"
              value={form.resources}
              onChangeText={set("resources")}
              multiline
              maxLength={3000}
            />
          </>
        )}
        {step === 2 && (
          <>
            <Text style={ui.sectionTitle}>{form.title}</Text>
            <Field
              label="Expected impact"
              value={form.impact}
              onChangeText={set("impact")}
              multiline
              maxLength={5000}
            />
            <Attachments value={files} onChange={setFiles} onBusy={setUploading} limit={3} />
            <T style={ui.small}>Your proposal is reviewed before it appears publicly.</T>
          </>
        )}
        {error !== "" && (
          <View accessibilityRole="alert">
            <T>{error}</T>
          </View>
        )}
        <Actions
          step={step}
          back={() => {
            setError("");
            setStep((s) => s - 1);
          }}
          next={next}
          submit="Submit proposal"
          busy={busy || uploading}
        />
      </View>
    </Screen>
  );
}
