import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";
import { getSettingsMap } from "@/lib/settings";
import { sendTemplateMail } from "@/lib/mailer";

const credsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, signIn, signOut, auth } = NextAuth(async () => {
  // Load settings at request time — supports dynamic Google OAuth config from DB.
  const s = await getSettingsMap().catch(() => ({} as Record<string, string>));

  const googleEnabled = s["oauth.google.enabled"] === "true";
  const googleClientId =
    s["oauth.google.clientId"] || process.env.GOOGLE_CLIENT_ID || "";
  const googleClientSecret =
    s["oauth.google.clientSecret"] || process.env.GOOGLE_CLIENT_SECRET || "";

  const credentialProviders: Provider[] = [
    Credentials({
      id: "user-credentials",
      name: "User credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;
        if (user.status === "suspended") return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        prisma.user
          .update({ where: { id: user.id }, data: { lastActiveAt: new Date() } })
          .catch(() => {});

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          role: "user" as const,
          kind: "user" as const,
        };
      },
    }),
    Credentials({
      id: "admin-credentials",
      name: "Admin credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const admin = await prisma.admin.findUnique({ where: { email } });
        if (!admin) return null;
        if (admin.status === "suspended") return null;

        const ok = await bcrypt.compare(password, admin.passwordHash);
        if (!ok) return null;

        prisma.admin
          .update({ where: { id: admin.id }, data: { lastActiveAt: new Date() } })
          .catch(() => {});

        return {
          id: admin.id,
          email: admin.email,
          name: admin.name ?? undefined,
          role: (admin.role === "superadmin" ? "superadmin" : "admin") as
            | "admin"
            | "superadmin",
          kind: "admin" as const,
        };
      },
    }),
  ];

  const providers = [...credentialProviders];

  if (googleEnabled && googleClientId && googleClientSecret) {
    providers.push(
      Google({ clientId: googleClientId, clientSecret: googleClientSecret }),
    );
  }

  return {
    ...authConfig,
    providers,
    callbacks: {
      ...authConfig.callbacks,
      async signIn({ user, account, profile }) {
        if (account?.provider === "google") {
          const email = user.email;
          if (!email) return false;

          // Google profile picture comes via profile.picture (raw OAuth profile)
          const googleAvatar =
            (profile as any)?.picture ?? user.image ?? null;

          const settings = await getSettingsMap().catch(() => ({} as Record<string, string>));
          const freeCreditEnabled = settings["business.free_credit_enabled"] === "true";
          const freeCreditAmount = parseInt(
            settings["business.free_credit_amount"] ?? "0",
            10,
          );
          const creditsTotal =
            freeCreditEnabled && freeCreditAmount > 0 ? freeCreditAmount : 10;

          const existing = await prisma.user.findUnique({ where: { email } });
          if (!existing) {
            const userName = user.name ?? email.split("@")[0];
            await prisma.user.create({
              data: {
                email,
                name: userName,
                passwordHash: "",
                avatar: googleAvatar,
                creditsTotal,
              },
            });

            // Fire-and-forget welcome email
            sendTemplateMail(email, "welcome", {
              brand_name: settings["brand.name"] || "6amStudio",
              user_name: userName,
              user_email: email,
              app_url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
            }).catch(() => null);
          } else {
            await prisma.user
              .update({
                where: { email },
                data: {
                  lastActiveAt: new Date(),
                  // Always update avatar if Google provides one
                  ...(googleAvatar ? { avatar: googleAvatar } : {}),
                },
              })
              .catch(() => {});
          }
          return true;
        }
        // Credentials providers — always allow (authorize() already validated)
        return true;
      },

      async jwt({ token, user, account }) {
        // Google OAuth: load DB user to get the correct id
        if (account?.provider === "google" && user?.email) {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
          });
          if (dbUser) {
            token.uid = dbUser.id;
            token.role = "user";
            token.kind = "user";
          }
          return token;
        }

        // Credentials providers — set from the returned user object
        if (user && !token.uid) {
          token.uid = user.id;
          token.role = (user.role ?? "user") as "user" | "admin" | "superadmin";
          token.kind = (user.kind ?? "user") as "user" | "admin";
        }
        return token;
      },
    },
  };
});
