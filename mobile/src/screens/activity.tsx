import { useAppNavigation } from "../lib/navigation";
import { useState } from "react";
import { Alert, Pressable, RefreshControl, Text, View } from "react-native";
import { useAuth, useI18n } from "../providers";
import { localeTags } from "../../../src/lib/i18n/messages";
import { profileSchema } from "../../../src/lib/validation";
import { platform } from "../lib/api";
import { useResource } from "../lib/resource";
import { Button, colors, Empty, ErrorView, Field, Loading, Screen, T, ui } from "../ui";
import { PostCard } from "./feed";
export function ActivityScreen() {
  const navigation = useAppNavigation();
  const { user } = useAuth();
  const [tab, setTab] = useState("problems");
  const resource = useResource(user ? "/api/dashboard" : null);
  if (!user)
    return (
      <Screen>
        <Empty title="Sign in to continue." />
        <Button title="Sign in" onPress={() => navigation.navigate("Auth")} />
      </Screen>
    );
  if (resource.loading && !resource.data) return <Loading />;
  if (resource.error) return <ErrorView message={resource.error} retry={resource.reload} />;
  const rows = resource.data?.[tab] ?? [];
  return (
    <Screen
      refreshControl={<RefreshControl refreshing={resource.loading} onRefresh={resource.reload} />}
    >
      <T style={ui.title}>My activity</T>
      <View style={ui.row}>
        {["problems", "proposals"].map((value) => (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: value === tab }}
            key={value}
            onPress={() => setTab(value)}
            style={[ui.chip, tab === value && ui.chipActive, { flex: 1, alignItems: "center" }]}
          >
            <T style={{ color: tab === value ? "white" : colors.ink }}>
              {value === "problems" ? "Problems" : "Solutions"}
            </T>
          </Pressable>
        ))}
      </View>
      {rows.length ? (
        rows.map((p: any) => <PostCard key={p.id} item={p} solution={tab === "proposals"} />)
      ) : (
        <Empty title="You have no posts yet." description="Choose what you want to do." />
      )}
    </Screen>
  );
}
export function NotificationsScreen() {
  const navigation = useAppNavigation();
  const { user } = useAuth();
  const { locale } = useI18n();
  const resource = useResource<any[]>(user ? "/api/platform/notifications" : null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!user)
    return (
      <Screen>
        <Empty title="Sign in to continue." />
        <Button title="Sign in" onPress={() => navigation.navigate("Auth")} />
      </Screen>
    );
  if (resource.loading && !resource.data) return <Loading />;
  if (resource.error) return <ErrorView message={resource.error} retry={resource.reload} />;
  async function mark(id?: string) {
    setBusy(true);
    setError("");
    try {
      await platform(`notifications${id ? "/" + id : ""}`, "PATCH");
      await resource.reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen
      refreshControl={<RefreshControl refreshing={resource.loading} onRefresh={resource.reload} />}
    >
      <T style={ui.title}>Notifications</T>
      <Button
        title="Mark all as read"
        secondary
        busy={busy}
        disabled={!resource.data?.some((n) => !n.read)}
        onPress={() => mark()}
      />
      {error !== "" && <T>{error}</T>}
      {!resource.data?.length && (
        <Empty title="You’re all caught up" description="Your next update will appear here." />
      )}
      {resource.data?.map((n) => (
        <Pressable
          accessibilityRole="button"
          key={n.id}
          onPress={() => {
            void mark(n.id);
            const problem = /^\/problems\/([^/?#]+)$/.exec(n.href);
            const solution = /^\/innovations\/([^/?#]+)$/.exec(n.href);
            if (problem) navigation.navigate("Problem", { id: problem[1] });
            else if (solution) navigation.navigate("Solution", { id: solution[1] });
            else navigation.navigate("Activity");
          }}
          style={[ui.card, !n.read && { borderColor: colors.ink }]}
        >
          <Text style={[ui.text, { fontWeight: n.read ? "400" : "600" }]}>{n.title}</Text>
          <Text style={ui.muted}>{n.body}</Text>
          <Text style={ui.small}>
            {new Date(n.createdAt).toLocaleDateString(localeTags[locale])}
          </Text>
        </Pressable>
      ))}
    </Screen>
  );
}
export function ProfileScreen() {
  const navigation = useAppNavigation();
  const { refreshUser } = useAuth();
  const resource = useResource("/api/platform/me");
  const { t } = useI18n();
  const [form, setForm] = useState<{ name: string; bio: string; skills: string } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (resource.loading && !resource.data) return <Loading />;
  if (resource.error) return <ErrorView message={resource.error} retry={resource.reload} />;
  if (!resource.data)
    return (
      <Screen>
        <Button title="Sign in" onPress={() => navigation.navigate("Auth")} />
      </Screen>
    );
  const input: { name: string; bio: string; skills: string } = form ?? {
    name: resource.data.name,
    bio: resource.data.bio,
    skills: resource.data.skills.join(", "),
  };
  const set = (key: "name" | "bio" | "skills") => (value: string) =>
    setForm({ ...input, [key]: value });
  return (
    <Screen>
      <T style={ui.title}>My profile</T>
      <View style={ui.card}>
        <Field label="Full name" value={input.name} onChangeText={set("name")} maxLength={80} />
        <Field
          label="About you"
          value={input.bio}
          onChangeText={set("bio")}
          multiline
          maxLength={2000}
        />
        <Field
          label="Skills (comma separated)"
          value={input.skills}
          onChangeText={set("skills")}
          maxLength={1000}
        />
        {error !== "" && <T>{error}</T>}
        <Button
          title="Save changes"
          busy={busy}
          onPress={async () => {
            const parsed = profileSchema.safeParse({
              ...input,
              skills: input.skills
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
              interests: resource.data.interests,
            });
            if (!parsed.success) {
              setError(parsed.error.issues[0].message);
              return;
            }
            setError("");
            setBusy(true);
            try {
              await platform("profile", "PATCH", parsed.data);
              await refreshUser();
              Alert.alert(t("Saved"));
              navigation.goBack();
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        />
      </View>
    </Screen>
  );
}
