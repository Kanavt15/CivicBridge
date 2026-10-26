import { useAppNavigation } from "../lib/navigation";
import { useDeferredValue, useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { Lightbulb, MapPin, Plus } from "lucide-react-native";
import { categories } from "../../../src/lib/domain";
import { useAuth, useI18n } from "../providers";
import { useResource } from "../lib/resource";
import { Button, colors, Empty, ErrorView, Field, Loading, Status, T, ui } from "../ui";

export function PostCard({ item, solution = false }: { item: any; solution?: boolean }) {
  const navigation = useAppNavigation();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.title}
      onPress={() => navigation.navigate(solution ? "Solution" : "Problem", { id: item.id })}
      style={[ui.card, { marginBottom: 12 }]}
    >
      <View style={ui.row}>
        <T style={ui.small}>{item.category ?? item.problem?.category}</T>
        {item.isDemo && <T style={ui.small}>Demo</T>}
      </View>
      <Text style={[ui.sectionTitle, { fontSize: 19 }]} numberOfLines={2}>
        {item.title}
      </Text>
      <Text numberOfLines={2} style={ui.muted}>
        {item.description ?? item.approach}
      </Text>
      <View style={[ui.row, { marginTop: 6 }]}>
        <View style={[ui.row, { flex: 1, justifyContent: "flex-start", gap: 5 }]}>
          <MapPin size={13} color={colors.muted} />
          <Text style={ui.small} numberOfLines={1}>
            {item.city ?? item.problem?.city}
          </Text>
        </View>
        <Status value={item.status} />
      </View>
    </Pressable>
  );
}
export function FeedScreen({
  home = false,
  solution = false,
}: {
  home?: boolean;
  solution?: boolean;
}) {
  const navigation = useAppNavigation();
  const { user } = useAuth();
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const query = useDeferredValue(search);
  const params = new URLSearchParams({ q: query, category, page: String(page) });
  const resource = useResource(
    solution ? "/api/platform/proposals" : `/api/platform/problems?${params}`,
  );
  const posts: any[] = solution
    ? (Array.isArray(resource.data) ? resource.data : []).filter(
        (p) =>
          (!category || p.problem?.category === category) &&
          `${p.title} ${p.approach} ${p.problem?.city}`.toLowerCase().includes(query.toLowerCase()),
      )
    : (resource.data?.items ?? []);
  const canReport = !user || ["CITIZEN", "ADMIN"].includes(user.role);
  const canPropose = !user || ["RESEARCHER", "INSTITUTION", "ADMIN"].includes(user.role);
  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      contentContainerStyle={ui.screen}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={resource.loading && Boolean(resource.data)}
          onRefresh={resource.reload}
          tintColor={colors.ink}
        />
      }
      ListHeaderComponent={
        <View style={{ gap: 18, marginBottom: 8 }}>
          <View>
            <T style={ui.title}>
              {home ? "Community" : solution ? "Explore solutions" : "Explore problems"}
            </T>
            <T style={[ui.muted, { marginTop: 5 }]}>
              {home
                ? "Small actions. Shared progress."
                : solution
                  ? "Practical ideas from your community."
                  : "Find a problem you can help solve."}
            </T>
          </View>
          {home && (
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t(canReport ? "Post a problem" : "Find a problem")}
                style={[ui.card, { flex: 1, backgroundColor: colors.ink, minHeight: 120 }]}
                onPress={() =>
                  canReport
                    ? navigation.navigate(user ? "Report" : "Auth")
                    : navigation.navigate("Tabs", { screen: "Explore" })
                }
              >
                <Plus size={25} color="white" />
                <T style={{ color: "white", fontWeight: "600", fontSize: 15 }}>
                  {canReport ? "Post a problem" : "Find a problem"}
                </T>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t(canPropose ? "Propose a solution" : "Explore solutions")}
                style={[ui.card, { flex: 1, minHeight: 120 }]}
                onPress={() =>
                  canPropose
                    ? navigation.navigate(user ? "Propose" : "Auth")
                    : navigation.navigate("Tabs", { screen: "Solutions" })
                }
              >
                <Lightbulb size={25} />
                <T style={{ fontWeight: "600", fontSize: 15 }}>
                  {canPropose ? "Propose a solution" : "Explore solutions"}
                </T>
              </Pressable>
            </View>
          )}
          <View style={{ marginBottom: -17 }}>
            <Field
              label="Search community posts"
              placeholder="Search a problem, idea, or city"
              value={search}
              onChangeText={(value) => {
                setSearch(value);
                setPage(1);
              }}
              returnKeyType="search"
            />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={ui.chips}
          >
            {["", ...categories].map((value) => (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: value === category }}
                key={value}
                onPress={() => {
                  setCategory(value);
                  setPage(1);
                }}
                style={[ui.chip, category === value && ui.chipActive]}
              >
                <T style={{ fontSize: 12, color: category === value ? "white" : colors.text }}>
                  {value || "Every category"}
                </T>
              </Pressable>
            ))}
          </ScrollView>
          {home && <T style={ui.sectionTitle}>Latest updates</T>}
        </View>
      }
      renderItem={({ item }) => <PostCard item={item} solution={solution} />}
      ListEmptyComponent={
        resource.loading ? (
          <Loading />
        ) : resource.error ? (
          <ErrorView message={resource.error} retry={resource.reload} />
        ) : (
          <Empty />
        )
      }
      ListFooterComponent={
        <View style={{ gap: 20 }}>
          {resource.error && posts.length > 0 && (
            <ErrorView message={resource.error} retry={resource.reload} />
          )}
          {!solution && resource.data?.pages > 1 && (
            <View style={ui.row}>
              <Button
                title="Previous"
                secondary
                disabled={page <= 1 || resource.loading}
                onPress={() => setPage((p) => p - 1)}
              />
              <Text style={ui.small}>
                {t("Page")} {page} / {resource.data.pages}
              </Text>
              <Button
                title="Next"
                secondary
                disabled={page >= resource.data.pages || resource.loading}
                onPress={() => setPage((p) => p + 1)}
              />
            </View>
          )}
          {solution && (
            <T style={ui.small}>
              Showing up to 100 recently reviewed public solutions. Your pending submissions are in
              My activity.
            </T>
          )}
        </View>
      }
    />
  );
}
export const HomeScreen = () => <FeedScreen home />;
export const ExploreScreen = () => <FeedScreen />;
export const SolutionsScreen = () => <FeedScreen solution />;
