import { useAppNavigation } from "../lib/navigation";
import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import {
  Activity,
  Bell,
  ChevronRight,
  Lightbulb,
  Plus,
  Settings,
  UserRound,
} from "lucide-react-native";
import { useAuth } from "../providers";
import { Button, colors, LanguagePicker, Screen, T, ui } from "../ui";
export function AccountScreen() {
  const { user, signOut } = useAuth();
  const navigation = useAppNavigation();
  const [busy, setBusy] = useState(false);
  return (
    <Screen>
      <T style={ui.title}>Account</T>
      <View style={ui.card}>
        <View style={[ui.row, { justifyContent: "flex-start" }]}>
          <View
            style={{
              height: 52,
              width: 52,
              borderRadius: 26,
              backgroundColor: colors.soft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <UserRound size={25} />
          </View>
          <View style={{ flex: 1 }}>
            {user ? (
              <Text style={ui.sectionTitle}>{user.name}</Text>
            ) : (
              <T style={ui.sectionTitle}>Your community starts here.</T>
            )}
            {user ? (
              <T style={ui.muted}>{user.role[0] + user.role.slice(1).toLowerCase()}</T>
            ) : (
              <T style={ui.muted}>Sign in to post and follow progress.</T>
            )}
          </View>
        </View>
        {!user && (
          <>
            <Button title="Sign in" onPress={() => navigation.navigate("Auth")} />
            <Button
              title="Create account"
              secondary
              onPress={() => navigation.navigate("Auth", { register: true })}
            />
          </>
        )}
      </View>
      {user && (
        <View style={ui.card}>
          {(
            [
              ["Activity", "My activity", Activity],
              ["Notifications", "Notifications", Bell],
              ["Profile", "My profile", Settings],
            ] as const
          ).map(([screen, label, Icon]) => (
            <Pressable
              accessibilityRole="button"
              key={screen}
              onPress={() => navigation.navigate(screen)}
              style={[ui.row, { paddingVertical: 14 }]}
            >
              <Icon size={21} color={colors.muted} />
              <T style={{ flex: 1 }}>{label}</T>
              <ChevronRight size={18} color={colors.muted} />
            </Pressable>
          ))}
        </View>
      )}
      <View style={ui.card}>
        <T style={ui.sectionTitle}>Choose language</T>
        <LanguagePicker />
      </View>
      {user && (
        <Button
          title="Sign out"
          secondary
          busy={busy}
          onPress={async () => {
            setBusy(true);
            try {
              const revoked = await signOut();
              if (!revoked)
                Alert.alert(
                  "Signed out on this device",
                  "Server revocation could not be confirmed. The session will expire automatically.",
                );
            } catch {
              Alert.alert("Could not sign out", "Please try again.");
            } finally {
              setBusy(false);
            }
          }}
        />
      )}
    </Screen>
  );
}
export function CreateScreen() {
  const { user } = useAuth();
  const navigation = useAppNavigation();
  return (
    <Screen>
      <T style={ui.title}>Make a contribution</T>
      <T style={ui.muted}>Choose what you want to do.</T>
      {(!user || ["CITIZEN", "ADMIN"].includes(user.role)) && (
        <View style={ui.card}>
          <Plus size={30} />
          <T style={ui.sectionTitle}>Post a problem</T>
          <T style={ui.muted}>A photo. A location. A better starting point.</T>
          <Button
            title="Post a problem"
            onPress={() => navigation.navigate(user ? "Report" : "Auth")}
          />
        </View>
      )}
      {(!user || ["RESEARCHER", "INSTITUTION", "ADMIN"].includes(user.role)) && (
        <View style={ui.card}>
          <Lightbulb size={30} />
          <T style={ui.sectionTitle}>Propose a solution</T>
          <T style={ui.muted}>Bring an idea to an open problem.</T>
          <Button
            title="Propose a solution"
            secondary
            onPress={() => navigation.navigate(user ? "Propose" : "Auth")}
          />
        </View>
      )}
      {user?.role === "INDUSTRY" && (
        <View style={ui.card}>
          <T style={ui.sectionTitle}>Find a problem</T>
          <T style={ui.muted}>Find a problem you can help solve.</T>
          <Button
            title="Explore problems"
            onPress={() => navigation.navigate("Tabs", { screen: "Explore" })}
          />
        </View>
      )}
    </Screen>
  );
}
