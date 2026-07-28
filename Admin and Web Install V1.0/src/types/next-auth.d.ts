import type { DefaultSession } from "next-auth";

type Role = "user" | "admin" | "superadmin";
type Kind = "user" | "admin";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: Role;
      kind: Kind;
    };
  }
  interface User {
    role?: Role;
    kind?: Kind;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    role?: Role;
    kind?: Kind;
  }
}
