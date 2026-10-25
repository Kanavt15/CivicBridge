// Only an explicitly launched test server on a disposable loopback database
// advertises its identity. Normal application/Atlas servers never opt in.
export function integrationDatabase(env: Record<string, string | undefined>) {
  if (env.CIVICBRIDGE_TEST_MODE !== "true") return null;
  try {
    const url = new URL(env.DATABASE_URL ?? "");
    const name = url.pathname.slice(1);
    return url.protocol === "mongodb:" &&
      ["127.0.0.1", "localhost"].includes(url.hostname) &&
      /^civicbridge_(?:upgrade_test|ci|test)(?:_[a-z0-9]+)?$/.test(name)
      ? name
      : null;
  } catch {
    return null;
  }
}
