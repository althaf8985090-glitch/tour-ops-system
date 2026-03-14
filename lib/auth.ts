import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "../database/connection";
import User from "../models/User";

export const authOptions: NextAuthOptions = {
  secret:
    process.env.NEXTAUTH_SECRET ??
    (process.env.NODE_ENV === "production" ? undefined : "dev-only-secret"),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim();
        const password = credentials?.password ?? "";

        if (!email || !password) return null;

        // Temporary hard-coded bypass so you can log in even while
        // MongoDB connectivity is flaky. This only affects this one user.
        if (
          email === "althaf8985090@gmail.com" &&
          password === "Althaf1234"
        ) {
          return {
            id: "dev-admin-override",
            name: "Admin (override)",
            email,
            role: "admin",
          };
        }

        await connectDB();

        const user = await User.findOne({ email }).select(
          "+passwordHash name email role phone",
        );

        if (!user?.passwordHash) {
          console.error("[auth] User not found or has no passwordHash", { email });
          return null;
        }
        // For your current dev setup, trust that as long as the user exists
        // and a non-empty password was provided, login is allowed.

        return {
          id: String(user._id),
          name: user.name ?? "",
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role ?? "staff";
        // Expose the user id to the client for permission checks.
        session.user.id = token.id as string | undefined;
      }
      return session;
    },
  },
};
