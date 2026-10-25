import { PrismaClient } from "@prisma/client";
try {
  process.loadEnvFile(".env");
} catch {
  /* Environment may already be supplied. */
}
const db = new PrismaClient();
async function main() {
  const [limits, files] = await db.$transaction([
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
  ]);
  console.log(
    `Removed ${limits.count} expired rate-limit buckets and ${files.count} unattached uploads older than 24 hours.`,
  );
}
main()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
