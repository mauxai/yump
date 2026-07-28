import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe auth config. No DB / bcrypt imports.
 * Used by middleware (Edge Runtime).
 */
export const authConfig: NextAuthConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  logger: {
    error(error) {
      // A session cookie minted under a previous AUTH_SECRET can't be
      // decrypted (e.g. the secret rotated). Auth.js already handles that
      // by treating the visitor as signed out — logging it on every
      // request is pure noise. Everything else still surfaces.
      if (error.name === "JWTSessionError") return;
      console.error("[auth][error]", error);
    },
  },
  providers: [],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Behind a reverse proxy the request-derived baseUrl can be the upstream
      // origin (e.g. http://localhost:3000), which sends logout/login
      // redirects to the wrong host. When NEXT_PUBLIC_APP_URL is configured,
      // treat it as the canonical public origin; otherwise fall back to the
      // derived baseUrl so a buyer's own deployment behaves as before.
      const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
      const base = appUrl || baseUrl;
      try {
        if (url.startsWith("/")) return `${base}${url}`;
        const target = new URL(url);
        if (target.origin === baseUrl || (appUrl && target.origin === appUrl)) {
          return `${base}${target.pathname}${target.search}${target.hash}`;
        }
      } catch {
        /* malformed url — fall through to base */
      }
      return base;
    },
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.role = (user.role ?? "user") as "user" | "admin" | "superadmin";
        token.kind = (user.kind ?? "user") as "user" | "admin";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const su = session.user as {
          id?: string;
          role?: "user" | "admin" | "superadmin";
          kind?: "user" | "admin";
        };
        if (token.uid) su.id = token.uid as string;
        su.role = (token.role ?? "user") as "user" | "admin" | "superadmin";
        su.kind = (token.kind ?? "user") as "user" | "admin";
      }
      return session;
    },
  },
};
