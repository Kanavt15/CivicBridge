import { productionIssues } from "../src/lib/production";
try {
  process.loadEnvFile(".env");
} catch {}
const issues = productionIssues(process.env);
if (issues.length) {
  console.error("Release configuration needs attention:");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exitCode = 1;
} else {
  console.log(
    "Production environment checks passed. Next run db:check and db:push from the deployment host.",
  );
  if (process.env.ALLOW_DEMO_ACCOUNTS === "true")
    console.log("Demo-account sign-in is explicitly enabled for this deployment.");
}
