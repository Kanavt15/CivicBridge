import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verifyCredentials } from "@/lib/credentials";
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
