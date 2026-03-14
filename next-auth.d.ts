import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  type UserRole = "admin" | "guide" | "staff";

  interface User {
    role: UserRole;
  }

  interface Session {
    user: DefaultSession["user"] & {
      role: UserRole;
      id?: string;
    };
  }
}

declare module "next-auth/jwt" {
  type UserRole = "admin" | "guide" | "staff";

  interface JWT {
    role?: UserRole;
    id?: string;
  }
}
