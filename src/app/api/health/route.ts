import { json } from "@/lib/http";
import { integrationDatabase } from "@/lib/test-isolation";
export const dynamic = "force-dynamic";
export function GET() {
  const testDatabase = integrationDatabase(process.env);
  return json({ status: "ok", service: "civicbridge", ...(testDatabase ? { testDatabase } : {}) });
}
