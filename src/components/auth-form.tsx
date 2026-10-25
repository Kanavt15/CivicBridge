"use client";
import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
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
      <aside className="auth-story">
        <Logo />
        <h2>
          One connection.
          <br />A world of
          <br />
          possibilities.
        </h2>
        <p>
          Join the citizens, researchers, and partners turning everyday challenges into meaningful
          change.
        </p>
        <ul>
          <li>
            <CheckCircle size={16} /> Give your community a voice
          </li>
          <li>
            <CheckCircle size={16} /> Put good ideas into action
          </li>
          <li>
            <CheckCircle size={16} /> Make progress, together
          </li>
        </ul>
      </aside>
      <div className="auth-form">
        <h1>{register ? "Find your place on the bridge." : "Welcome back."}</h1>
        <p>
          {register
            ? "Create an account. Your next idea could make a difference."
            : "Your community’s next chapter starts here."}
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
                Full name
                <input
                  name="name"
                  autoComplete="name"
                  minLength={2}
                  maxLength={80}
                  required
                  placeholder="Your full name"
                />
              </label>
              <label className="field">
                I’m joining as
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="CITIZEN">Citizen</option>
                  <option value="RESEARCHER">Student / researcher</option>
                  <option value="INSTITUTION">University / institution</option>
                  <option value="INDUSTRY">Industry / NGO</option>
                </select>
              </label>
              {["INSTITUTION", "INDUSTRY"].includes(role) && (
                <>
                  <label className="field">
                    Organization name
                    <input name="organizationName" minLength={2} required />
                  </label>
                  <label className="field">
                    Organization city
                    <input name="city" minLength={2} required />
                  </label>
                  <small className="muted">
                    An administrator will review your organization’s verification.
                  </small>
                </>
              )}
            </>
          )}
          <label className="field">
            Email address
            <input
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
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={register ? "new-password" : "current-password"}
              minLength={register ? 12 : 1}
              maxLength={128}
              required
              placeholder={register ? "At least 12 characters" : "Your password"}
            />
            {register && <small>Use uppercase and lowercase letters and a number.</small>}
          </label>
          <Button disabled={busy} type="submit">
            {busy ? <LoaderCircle size={16} className="spin" /> : <ArrowUpRight size={16} />}{" "}
            {busy ? "Connecting…" : register ? "Create account" : "Sign in"}
          </Button>
        </form>
        <div className="auth-switch">
          {register ? "Already on the bridge? " : "New to CivicBridge? "}
          <Link href={register ? "/login" : "/register"}>
            {register ? "Sign in" : "Create an account"}
          </Link>
        </div>
        {!register && demoEnabled && (
          <div className="demo-panel">
            <strong>Take a look around</strong>
            <p>Local demo accounts · sample data only</p>
            <div className="demo-roles">
              {["CITIZEN", "RESEARCHER", "INSTITUTION", "INDUSTRY", "ADMIN"].map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setEmail(`${r.toLowerCase()}@demo.civicbridge.in`);
                    setPassword("CivicBridge@2026");
                  }}
                >
                  {label(r)}
                </button>
              ))}
            </div>
            <small>
              Choose a role to fill the credentials, then sign in. Default password:
              CivicBridge@2026. Available after running the seed script with that password.
            </small>
          </div>
        )}
      </div>
    </div>
  );
}
