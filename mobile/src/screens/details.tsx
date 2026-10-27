import { useLocalSearchParams } from "expo-router";
import { useAppNavigation } from "../lib/navigation";
import { useState } from "react";
import { Image, RefreshControl, Share, Text, View } from "react-native";
import { MapPin, Share2, ThumbsUp } from "lucide-react-native";
import { useAuth } from "../providers";
import { useResource } from "../lib/resource";
import { apiUrl, fileSource, platform } from "../lib/api";
import { Button, colors, ErrorView, Field, Loading, Screen, Status, T, ui } from "../ui";
import { PostCard } from "./feed";
export function ProblemScreen() {
  const navigation = useAppNavigation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const resource = useResource(`/api/platform/problems/${id}`);
  const { user } = useAuth();
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (resource.loading && !resource.data) return <Loading />;
  if (resource.error) return <ErrorView message={resource.error} retry={resource.reload} />;
  const p = resource.data;
  if (!p) return null;
  const publicPost = ["OPEN", "COLLABORATION", "PILOT", "RESOLVED"].includes(p.status);
  async function write(action: string, body?: unknown) {
    setBusy(true);
    setError("");
    try {
      await platform(`problems/${p.id}/${action}`, "POST", body);
      if (action === "comments") setComment("");
      await resource.reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen
      refreshControl={
        <RefreshControl refreshing={resource.refreshing} onRefresh={resource.reload} />
      }
    >
      <View style={ui.row}>
        <T style={ui.small}>{p.category}</T>
        <Status value={p.status} />
      </View>
      <Text style={ui.title}>{p.title}</Text>
      <View style={[ui.row, { justifyContent: "flex-start" }]}>
        <MapPin size={17} color={colors.muted} />
        <Text style={ui.muted}>
          {p.area}, {p.city}, {p.state}
        </Text>
      </View>
      {!publicPost && (
        <View style={ui.card}>
          <T>Your report is reviewed before it appears publicly.</T>
        </View>
      )}
      <Text style={ui.text}>{p.description}</Text>
      {p.images?.map((image: any) => (
        <Image
          key={image.id}
          source={fileSource(image.id)}
          accessibilityLabel={image.name}
          resizeMode="cover"
          style={{ width: "100%", height: 230, borderRadius: 12 }}
        />
      ))}
      <View style={ui.row}>
        <T style={ui.muted}>People affected</T>
        <Text style={ui.text}>{p.population.toLocaleString()}</Text>
      </View>
      {publicPost && (
        <Button
          title="Share"
          secondary
          icon={<Share2 size={17} />}
          onPress={() => {
            void Share.share({ title: p.title, message: `${p.title}\n${apiUrl}/problems/${p.id}` });
          }}
        />
      )}
      {user && (
        <Button
          title="Support this problem"
          secondary
          busy={busy}
          icon={<ThumbsUp size={17} />}
          onPress={() => write("vote")}
        />
      )}
      {p.status === "OPEN" &&
        user &&
        ["RESEARCHER", "INSTITUTION", "ADMIN"].includes(user.role) && (
          <Button
            title="Propose a solution"
            onPress={() => navigation.navigate("Propose", { problemId: p.id })}
          />
        )}
      <T style={ui.sectionTitle}>Solutions</T>
      {p.proposals?.length ? (
        p.proposals.map((s: any) => (
          <PostCard
            key={s.id}
            item={{ ...s, problem: { city: p.city, category: p.category } }}
            solution
          />
        ))
      ) : (
        <T style={ui.muted}>No solutions yet</T>
      )}
      <T style={ui.sectionTitle}>Community discussion</T>
      {p.comments?.map((c: any) => (
        <View key={c.id} style={ui.card}>
          <Text style={{ fontWeight: "600", color: colors.ink }}>{c.author.name}</Text>
          <Text style={ui.text}>{c.body}</Text>
        </View>
      ))}
      {user ? (
        <View style={ui.card}>
          <Field
            label="Add a comment"
            value={comment}
            onChangeText={setComment}
            multiline
            maxLength={3000}
          />
          <Button
            title="Post comment"
            disabled={comment.trim().length < 3}
            busy={busy}
            onPress={() => write("comments", { body: comment.trim() })}
          />
        </View>
      ) : (
        <Button
          title="Sign in to join the discussion"
          secondary
          onPress={() => navigation.navigate("Auth")}
        />
      )}
      {error !== "" && (
        <View accessibilityRole="alert">
          <T>{error}</T>
        </View>
      )}
    </Screen>
  );
}
export function SolutionScreen() {
  const navigation = useAppNavigation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const resource = useResource(`/api/platform/proposals/${id}`);
  if (resource.loading && !resource.data) return <Loading />;
  if (resource.error) return <ErrorView message={resource.error} retry={resource.reload} />;
  const p = resource.data;
  if (!p) return null;
  return (
    <Screen
      refreshControl={
        <RefreshControl refreshing={resource.refreshing} onRefresh={resource.reload} />
      }
    >
      <View style={ui.row}>
        <T style={ui.small}>{p.problem.category}</T>
        <Status value={p.status} />
      </View>
      <Text style={ui.title}>{p.title}</Text>
      <Text style={ui.muted}>{p.author.name}</Text>
      {[
        ["Your proposed approach", p.approach],
        ["Technology and methods", p.techStack],
        ["Feasibility and implementation", p.feasibility],
        ["Resources needed", p.resources],
        ["Expected impact", p.impact],
      ].map(([heading, body]) => (
        <View key={heading} style={{ gap: 8 }}>
          <T style={ui.sectionTitle}>{heading}</T>
          <Text style={ui.text}>{body}</Text>
        </View>
      ))}
      {p.attachments
        ?.filter((file: any) => file.mime.startsWith("image/"))
        .map((file: any) => (
          <Image
            key={file.id}
            source={fileSource(file.id)}
            accessibilityLabel={file.name}
            style={{ width: "100%", height: 230, borderRadius: 12 }}
          />
        ))}
      <Button
        title="View problem"
        secondary
        onPress={() => navigation.navigate("Problem", { id: p.problem.id })}
      />
    </Screen>
  );
}
