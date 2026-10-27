import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verifyCredentials } from "@/lib/credentials";
import { db } from "@/lib/db";
import { demoAccountsAllowed } from "@/lib/production";
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        return verifyCredentials(credentials);
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      } else if (token.id) {
        const current = await db.user.findFirst({
          where: {
            id: String(token.id),
            active: true,
            ...(!demoAccountsAllowed() ? { isDemo: false } : {}),
          },
          select: { name: true, email: true, role: true },
        });
        if (!current) return null;
        token.name = current.name;
        token.email = current.email;
        token.role = current.role;
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
