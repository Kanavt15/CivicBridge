import { AuthForm } from "@/components/auth-form";
import { demoAccountsAllowed } from "@/lib/production";
export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in" };
export default function Page() {
  return <AuthForm demoEnabled={demoAccountsAllowed()} />;
}
