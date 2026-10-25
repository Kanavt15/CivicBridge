import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/security";
import { demoAccountsAllowed } from "@/lib/production";
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const parsed = z
          .object({ email: z.email().max(254), password: z.string().min(1).max(128) })
          .safeParse(credentials);
        if (!parsed.success) return null;
        const email = parsed.data.email.toLowerCase();
        await rateLimit(email, "login", 10, 15 * 60000);
        const user = await db.user.findUnique({ where: { email } });
        const valid = await compare(
          parsed.data.password,
          user?.passwordHash ?? "$2b$12$d7ztK6nrq.XZ53/1VdHIT.CvFplHgFBR8LD.yO0lUEy3/QfDHQWFS",
        );
        if (!user || !user.active || !valid || (user.isDemo && !demoAccountsAllowed())) return null;
        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as import("@prisma/client").Role;
      return session;
    },
  },
});
