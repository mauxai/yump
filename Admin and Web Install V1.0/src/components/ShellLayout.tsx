import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { clearSessionAndRedirect } from "@/lib/clear-session";
import { getSettingsMap } from "@/lib/settings";
import { buildAvatarUrl } from "@/lib/storage-url";
import { getActiveLanguages } from "@/lib/get-active-languages";
import { Sidebar } from "./Sidebar";
import { UserTopBar } from "./UserTopBar";
import { TranslatedPageHeader } from "./TranslatedPageHeader";
import { NotificationBell } from "./NotificationBell";

/**
 * Server component that renders the sidebar + a content area.
 * Used by secondary pages (Billing, Settings, Activity) that share the shell.
 *
 * Pass `titleKey` / `subtitleKey` (dot-notation i18n keys) for translated headings.
 * The `title` / `subtitle` strings serve as the English fallback when keys are absent.
 */
export async function ShellLayout({
  title,
  titleKey,
  subtitle,
  subtitleKey,
  children,
}: {
  title: string;
  titleKey?: string;
  subtitle?: string;
  subtitleKey?: string;
  children: ReactNode;
}) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/login");

  const [user, settings, languages] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, avatar: true, creditsUsed: true, creditsTotal: true },
    }),
    getSettingsMap(),
    getActiveLanguages(),
  ]);
  if (!user) clearSessionAndRedirect("/login");

  const brand = {
    name: settings["brand.name"] ?? "6amStudio",
    logo: settings["brand.logo"] ?? "",
    slogan: settings["brand.slogan"] ?? "",
  };

  return (
    <div className="h-screen flex bg-bg-0">
      <Sidebar
        user={{
          name: user.name ?? user.email.split("@")[0],
          email: user.email,
          avatar: buildAvatarUrl(user.avatar),
        }}
        credits={{ used: user.creditsUsed, total: user.creditsTotal }}
        role="user"
        brand={brand}
      />
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <UserTopBar
          left={
            <TranslatedPageHeader
              title={title}
              titleKey={titleKey}
              subtitle={subtitle}
              subtitleKey={subtitleKey}
            />
          }
          right={<NotificationBell />}
          user={{
            name: user!.name ?? user!.email.split("@")[0],
            email: user!.email,
            avatar: buildAvatarUrl(user!.avatar),
          }}
          languages={languages}
        />
        <div className="flex-1 overflow-auto px-4 py-4 md:px-6 md:py-5 lg:px-8 lg:py-6">{children}</div>
      </div>
    </div>
  );
}
