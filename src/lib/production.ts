import { databaseTarget } from "./database-config";
export function demoAccountsAllowed(env: Record<string, string | undefined> = process.env) {
  return env.NODE_ENV !== "production" || env.ALLOW_DEMO_ACCOUNTS === "true";
}
export function productionIssues(env: Record<string, string | undefined>) {
  const issues: string[] = [];
  try {
    databaseTarget(env.DATABASE_URL);
  } catch (e) {
    issues.push((e as Error).message);
  }
  if (
    !env.AUTH_SECRET ||
    env.AUTH_SECRET.length < 32 ||
    /replace|change-me|example/i.test(env.AUTH_SECRET)
  )
    issues.push("Set a random AUTH_SECRET of at least 32 characters.");
  try {
    const u = new URL(env.AUTH_URL ?? "");
    if (
      u.protocol !== "https:" ||
      u.pathname !== "/" ||
      u.search ||
      u.hash ||
      u.username ||
      u.password
    )
      issues.push("AUTH_URL must be the exact public HTTPS origin, without paths or credentials.");
  } catch {
    issues.push("Set AUTH_URL to the public HTTPS application origin.");
  }
  if (env.AUTH_TRUST_HOST !== "true")
    issues.push("Set AUTH_TRUST_HOST=true behind the trusted hosting proxy.");
  return issues;
}
