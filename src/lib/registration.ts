import { hash } from "bcryptjs";
import { db } from "./db";
import { rateLimit } from "./security";
import { registerSchema } from "./validation";
export async function registerUser(body: unknown) {
  const input = registerSchema.parse(body);
  await rateLimit(input.email, "register", 3, 3600000);
  await rateLimit("global", "registration", 100, 3600000);
  const passwordHash = await hash(input.password, 12);
  return db.$transaction(async (tx) => {
    const org = input.organizationName
      ? await tx.organization.create({
          data: {
            name: input.organizationName,
            type: input.role,
            city: input.city!,
            verified: false,
          },
        })
      : null;
    return tx.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: input.role,
        organizationId: org?.id,
      },
      select: { id: true, name: true, role: true, isDemo: true },
    });
  });
}
