import { View } from "react-native";
import { Tabs } from "expo-router";
import { Compass, Home, Lightbulb, Plus, UserRound } from "lucide-react-native";
import { useI18n } from "../../providers";
import { colors } from "../../ui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
const definitions = [
  ["index", "Home", Home],
  ["explore", "Explore", Compass],
  ["create", "Create", Plus],
  ["solutions", "Solutions", Lightbulb],
  ["account", "Account", UserRound],
] as const;
export default function AppTabs() {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 10, marginBottom: 3 },
        tabBarStyle: {
          height: 65 + Math.max(8, insets.bottom),
          paddingBottom: Math.max(8, insets.bottom),
          paddingTop: 8,
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
      }}
    >
      {definitions.map(([name, title, Icon]) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title: t(title),
            tabBarIcon: ({ color, focused }) => (
              <View
                style={
                  name === "create"
                    ? {
                        backgroundColor: colors.ink,
                        borderRadius: 8,
                        width: 40,
                        height: 28,
                        alignItems: "center",
                        justifyContent: "center",
                      }
                    : undefined
                }
              >
                <Icon
                  size={22}
                  color={name === "create" ? "white" : color}
                  strokeWidth={focused ? 2.3 : 1.7}
                />
              </View>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
