import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";
import { z } from "zod";
try {
  process.loadEnvFile(".env");
} catch {
  /* Hosted environments inject secrets. */
}
const db = new PrismaClient();
async function main() {
  const email = z.email().parse(process.argv[2]).toLowerCase();
  const name = z.string().trim().min(2).max(80).parse(process.argv[3]);
  if (!process.stdin.isTTY)
    throw new Error("Run this trusted provisioning command in an interactive terminal.");
  if (await db.user.findUnique({ where: { email } }))
    throw new Error(
      "An account already exists with this email. This command never upgrades existing accounts.",
    );
  const silent = new Writable({
    write(_chunk, _encoding, callback) {
      callback();
    },
  });
  const rl = createInterface({ input: process.stdin, output: silent, terminal: true });
  let password = "";
  try {
    process.stdout.write("Administrator password (hidden): ");
    password = await rl.question("");
    process.stdout.write("\nConfirm password (hidden): ");
    const confirm = await rl.question("");
    process.stdout.write("\n");
    if (password !== confirm) throw new Error("Passwords did not match.");
  } finally {
    rl.close();
  }
  z.string().min(12).max(128).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/).parse(password);
  await db.user.create({
    data: { name, email, passwordHash: await hash(password, 12), role: "ADMIN" },
  });
  console.log("Administrator created. Use the application sign-in page.");
}
main()
  .catch((e) => {
    console.error(
      e instanceof z.ZodError
        ? "Provide a valid email/name and a 12+ character password with uppercase, lowercase, and a number."
        : e.message,
    );
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
