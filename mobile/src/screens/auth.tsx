import { useLocalSearchParams } from "expo-router";
import { useAppNavigation } from "../lib/navigation";
import { useState } from "react";
import { View } from "react-native";
import { registerSchema } from "../../../src/lib/validation";
import { api } from "../lib/api";
import { useAuth } from "../providers";
import { Button, Field, Screen, Select, T, ui } from "../ui";
export function AuthScreen() {
  const navigation = useAppNavigation();
  const params = useLocalSearchParams<{ register?: string }>();
  const register = params.register === "true";
  const { signIn } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("CITIZEN");
  const [organizationName, setOrganization] = useState("");
  const [city, setCity] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit() {
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      if (register) {
        const parsed = registerSchema.safeParse({
          name,
          email: email.trim(),
          password,
          role,
          ...(["INSTITUTION", "INDUSTRY"].includes(role) ? { organizationName, city } : {}),
        });
        if (!parsed.success) {
          setError(parsed.error.issues[0].message);
          return;
        }
        await api("/api/mobile/register", { method: "POST", body: JSON.stringify(parsed.data) });
      }
      await signIn(email, password);
      setPassword("");
      navigation.replace("Activity");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen>
      <View>
        <T style={ui.title}>{register ? "Create account" : "Welcome back."}</T>
        <T style={[ui.muted, { marginTop: 8 }]}>Sign in to your community.</T>
      </View>
      <View style={ui.card}>
        {register && (
          <>
            <Field
              label="Full name"
              value={name}
              onChangeText={setName}
              maxLength={80}
              autoComplete="name"
            />
            <Select
              label="Your role"
              value={role}
              onChange={setRole}
              options={[
                { value: "CITIZEN", label: "Citizen" },
                { value: "RESEARCHER", label: "Researcher" },
                { value: "INSTITUTION", label: "Institution" },
                { value: "INDUSTRY", label: "Industry" },
              ]}
            />
            {["INSTITUTION", "INDUSTRY"].includes(role) && (
              <>
                <Field
                  label="Organization name"
                  value={organizationName}
                  onChangeText={setOrganization}
                  maxLength={150}
                />
                <Field label="City" value={city} onChangeText={setCity} maxLength={80} />
              </>
            )}
          </>
        )}
        <Field
          label="Email address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          maxLength={254}
        />
        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete={register ? "new-password" : "current-password"}
          maxLength={128}
        />
        {register && <T style={ui.small}>Use uppercase and lowercase letters and a number.</T>}
        {error !== "" && (
          <View accessibilityRole="alert">
            <T>{error}</T>
          </View>
        )}
        <Button title={register ? "Create account" : "Sign in"} onPress={submit} busy={busy} />
        <Button
          title={register ? "Already have an account?" : "Create account"}
          secondary
          disabled={busy}
          onPress={() => {
            setError("");
            navigation.setParams({ register: !register });
          }}
        />
      </View>
    </Screen>
  );
}
