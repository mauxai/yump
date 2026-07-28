import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { clearSessionAndRedirect } from "@/lib/clear-session";
import { getSettingsMap } from "@/lib/settings";
import { buildAvatarUrl } from "@/lib/storage-url";
import { getActiveLanguages } from "@/lib/get-active-languages";
import { Dashboard } from "@/components/Dashboard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/login");

  const [user, projects, settings, languages] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { edits: true } },
      },
    }),
    getSettingsMap(),
    getActiveLanguages(),
  ]);

  if (!user) clearSessionAndRedirect("/login");

  return (
    <Dashboard
      userName={user.name ?? user.email.split("@")[0]}
      userEmail={user.email}
      userAvatarUrl={buildAvatarUrl(user.avatar)}
      credits={{ used: user.creditsUsed, total: user.creditsTotal }}
      role="user"
      brand={{
        name: settings["brand.name"] ?? "6amStudio",
        logo: settings["brand.logo"] ?? "",
        slogan: settings["brand.slogan"] ?? "",
      }}
      projects={projects.map((p) => ({
        id: p.id,
        name: p.name,
        edits: p._count.edits,
        updatedAt: p.updatedAt.toISOString(),
      }))}
      languages={languages}
    />
  );
}
