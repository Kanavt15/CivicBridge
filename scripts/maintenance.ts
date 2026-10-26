import { PrismaClient } from "@prisma/client";
try {
  process.loadEnvFile(".env");
} catch {
  /* Environment may already be supplied. */
}
const db = new PrismaClient();
async function main() {
  const [limits, files, sessions] = await db.$transaction([
    db.rateLimit.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
    db.problemImage.deleteMany({
      where: {
        AND: [
          { OR: [{ problemId: null }, { problemId: { isSet: false } }] },
          { OR: [{ proposalId: null }, { proposalId: { isSet: false } }] },
        ],
        createdAt: { lt: new Date(Date.now() - 86400000) },
      },
    }),
    db.mobileSession.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
  ]);
  console.log(
    `Removed ${limits.count} expired rate-limit buckets, ${sessions.count} expired mobile sessions, and ${files.count} unattached uploads older than 24 hours.`,
  );
}
main()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
