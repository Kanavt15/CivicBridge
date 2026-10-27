import { KeyboardAvoidingView, Platform, Pressable, Text, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useNetInfo } from "@react-native-community/netinfo";
import { Bell, WifiOff } from "lucide-react-native";
import { MobileProviders, useAuth, useI18n } from "../providers";
import { apiUrl, isLoopbackPreview } from "../lib/api";
import { colors, LanguagePicker, Loading, Screen, T, ui } from "../ui";
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.canvas,
    card: colors.card,
    text: colors.ink,
    primary: colors.ink,
    border: colors.border,
    notification: colors.ink,
  },
};
function Navigator() {
  const { ready } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const network = useNetInfo();
  if (!ready) return <Loading />;
  if (!apiUrl)
    return (
      <Screen>
        <T style={ui.title}>CivicBridge</T>
        <T style={ui.muted}>Server address has not been configured.</T>
        <Text style={ui.text}>
          Set EXPO_PUBLIC_API_URL in mobile/.env to your development server or deployed HTTPS
          origin, then restart Expo. See docs/NATIVE_APP.md.
        </Text>
      </Screen>
    );
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {network.isConnected === false && !isLoopbackPreview && (
        <View
          accessibilityRole="alert"
          style={{ backgroundColor: colors.soft, flexDirection: "row", gap: 9, padding: 12 }}
        >
          <WifiOff size={17} />
          <T style={{ fontSize: 12, flex: 1 }}>You’re offline. Reconnect before posting.</T>
        </View>
      )}
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: colors.canvas },
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.card },
          headerTitleStyle: { fontSize: 17, fontWeight: "600" },
          headerTintColor: colors.ink,
          headerRight: () => <LanguagePicker />,
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{
            title: "CivicBridge",
            headerRight: () => (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 13 }}>
                <LanguagePicker />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("Notifications")}
                  onPress={() => router.push("/notifications")}
                  hitSlop={10}
                >
                  <Bell size={21} color={colors.muted} />
                </Pressable>
              </View>
            ),
          }}
        />
        <Stack.Screen name="problems/[id]" options={{ title: t("Problem details") }} />
        <Stack.Screen name="solutions/[id]" options={{ title: t("Solution details") }} />
        <Stack.Screen name="report" options={{ title: t("Post a problem") }} />
        <Stack.Screen name="propose" options={{ title: t("Propose a solution") }} />
        <Stack.Screen name="auth" options={{ title: t("Your account") }} />
        <Stack.Screen name="activity" options={{ title: t("My activity") }} />
        <Stack.Screen name="notifications" options={{ title: t("Notifications") }} />
        <Stack.Screen name="profile" options={{ title: t("My profile") }} />
      </Stack>
    </KeyboardAvoidingView>
  );
}
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <MobileProviders>
        <ThemeProvider value={theme}>
          <StatusBar style="dark" />
          <Navigator />
        </ThemeProvider>
      </MobileProviders>
    </SafeAreaProvider>
  );
}
