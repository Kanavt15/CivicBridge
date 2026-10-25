import { PrismaClient } from "@prisma/client";
import { databaseTarget } from "../src/lib/database-config";

try {
  process.loadEnvFile(".env");
} catch {
  // Hosting platforms supply environment variables directly.
}

async function main() {
  let target;
  try {
    target = databaseTarget(process.env.DATABASE_URL);
  } catch (error) {
    console.error((error as Error).message);
    process.exitCode = 1;
    return;
  }
  const checkUrl = new URL(process.env.DATABASE_URL!);
  checkUrl.searchParams.set("serverSelectionTimeoutMS", "5000");
  checkUrl.searchParams.set("connectTimeoutMS", "5000");
  const db = new PrismaClient({ datasourceUrl: checkUrl.toString() });
  try {
    await db.$runCommandRaw({ ping: 1 });
    // A read-only transaction checks the same replica-set and database access the app needs.
    await db.$transaction(async (tx) => {
      await tx.user.findFirst({ select: { id: true } });
    });
    console.log(
      `${target.kind} connection, application collection access, and transactions verified.`,
    );
    console.log("This check does not seed, copy, or modify application records.");
  } catch (error) {
    // Avoid printing driver errors that might include the credential-bearing URI.
    const code = (error as { code?: string }).code;
    console.error(
      "Database check failed. Verify the database user, database name, IP access list, and replica-set/cluster availability.",
    );
    if (typeof code === "string" && /^P\d{4}$/.test(code))
      console.error(`Prisma error code: ${code}`);
    process.exitCode = 1;
  } finally {
    await db.$disconnect();
  }
}

main().catch(() => {
  console.error(
    "Database configuration could not be checked. No connection credentials were printed.",
  );
  process.exitCode = 1;
});
