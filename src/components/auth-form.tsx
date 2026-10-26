"use client";
import { Input, Select, Control } from "@/components/localized-fields";
import { Text } from "@/components/i18n";

import Link from "@/components/localized-fields";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { usePlatformRouter as useRouter } from "@/components/app-context";
import { ArrowUpRight, CheckCircle, LoaderCircle } from "lucide-react";
import { Logo } from "./header";
import { Button } from "./ui/button";
import { api } from "@/lib/client";
import { label } from "@/lib/utils";
export function AuthForm({
  register = false,
  demoEnabled = false,
}: {
  register?: boolean;
  demoEnabled?: boolean;
}) {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [role, setRole] = useState("CITIZEN"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const router = useRouter();
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      if (register)
        await api("register", "POST", {
          name: form.get("name"),
          email,
          password,
          role,
          ...(["INSTITUTION", "INDUSTRY"].includes(role)
            ? { organizationName: form.get("organizationName"), city: form.get("city") }
            : {}),
        });
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error)
        throw new Error(
          "Sign-in failed. Check your email and password, or try again after the login rate limit resets.",
        );
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-wrap">
      <div className="auth-form">
        <h1>
          <Text>{register ? "Find your place on the bridge." : "Welcome back."}</Text>
        </h1>
        <p>
          <Text>{register ? "One account. A shared purpose." : "Sign in to your community."}</Text>
        </p>
        {error && (
          <div className="form-message" role="alert">
            {error}
          </div>
        )}
        <form onSubmit={submit} className="form-stack">
          {register && (
            <>
              <label className="field">
                <Text>{"Full name"}</Text>
                <Input
                  name="name"
                  autoComplete="name"
                  minLength={2}
                  maxLength={80}
                  required
                  placeholder="Your full name"
                />
              </label>
              <label className="field">
                <Text>{"I’m joining as"}</Text>
                <Select value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="CITIZEN">
                    <Text>{"Citizen"}</Text>
                  </option>
                  <option value="RESEARCHER">
                    <Text>{"Student / researcher"}</Text>
                  </option>
                  <option value="INSTITUTION">
                    <Text>{"University / institution"}</Text>
                  </option>
                  <option value="INDUSTRY">
                    <Text>{"Industry / NGO"}</Text>
                  </option>
                </Select>
              </label>
              {["INSTITUTION", "INDUSTRY"].includes(role) && (
                <>
                  <label className="field">
                    <Text>{"Organization name"}</Text>
                    <Input name="organizationName" minLength={2} required />
                  </label>
                  <label className="field">
                    <Text>{"Organization city"}</Text>
                    <Input name="city" minLength={2} required />
                  </label>
                  <small className="muted">
                    <Text>{"An administrator will review your organization’s verification."}</Text>
                  </small>
                </>
              )}
            </>
          )}
          <label className="field">
            <Text>{"Email address"}</Text>
            <Input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={254}
              required
              placeholder="you@example.com"
            />
          </label>
          <label className="field">
            <Text>{"Password"}</Text>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={register ? "new-password" : "current-password"}
              minLength={register ? 12 : 1}
              maxLength={128}
              required
              placeholder={register ? "At least 12 characters" : "Your password"}
            />
            {register && (
              <small>
                <Text>{"Use uppercase and lowercase letters and a number."}</Text>
              </small>
            )}
          </label>
          <Button disabled={busy} type="submit">
            {busy ? <LoaderCircle size={16} className="spin" /> : <ArrowUpRight size={16} />}
            <Text> </Text>
            <Text>{busy ? "Connecting…" : register ? "Create account" : "Sign in"}</Text>
          </Button>
        </form>
        <div className="auth-switch">
          <Text>{register ? "Already on the bridge? " : "New to CivicBridge? "}</Text>
          <Link href={register ? "/login" : "/register"}>
            <Text>{register ? "Sign in" : "Create an account"}</Text>
          </Link>
        </div>
        {!register && demoEnabled && (
          <details className="demo-panel">
            <summary>
              <Text>{"Try a demo account"}</Text>
            </summary>
            <p>
              <Text>{"Local demo accounts · sample data only"}</Text>
            </p>
            <div className="demo-roles">
              {["CITIZEN", "RESEARCHER", "INSTITUTION", "INDUSTRY", "ADMIN"].map((r) => (
                <Control
                  key={r}
                  onClick={() => {
                    setEmail(`${r.toLowerCase()}@demo.civicbridge.in`);
                    setPassword("CivicBridge@2026");
                  }}
                >
                  <Text>{label(r)}</Text>
                </Control>
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
