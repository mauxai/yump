import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { clearSessionAndRedirect } from "@/lib/clear-session";
import { getSettingsMap } from "@/lib/settings";
import { buildAvatarUrl } from "@/lib/storage-url";
import { Sidebar } from "./Sidebar";
import { AdminTopBar } from "./AdminTopBar";

export async function AdminShellLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();
  const sessionUser = session?.user as
    | { id?: string; kind?: "user" | "admin" }
    | undefined;
  if (!sessionUser?.id || sessionUser.kind !== "admin") {
    redirect("/admin/login");
  }

  const [admin, settings, languages] = await Promise.all([
    prisma.admin.findUnique({ where: { id: sessionUser.id } }),
    getSettingsMap(),
    prisma.language.findMany({
      where: { isActive: true },
      select: { code: true, name: true, nativeName: true, isDefault: true, direction: true },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    }),
  ]);
  if (!admin) clearSessionAndRedirect("/admin/login");

  const brand = {
    name: settings["brand.name"] ?? "6amStudio",
    logo: settings["brand.logo"] ?? "",
    slogan: settings["brand.slogan"] ?? "",
  };

  const displayName = admin.name ?? admin.email.split("@")[0];
  // Cast needed until TS server picks up regenerated Prisma client
  const avatar = buildAvatarUrl((admin as unknown as { avatar: string | null }).avatar);

  return (
    <div className="h-screen flex bg-bg-0">
      <Sidebar
        user={{ name: displayName, email: admin.email, avatar }}
        credits={{ used: 0, total: 0 }}
        role="admin"
        brand={brand}
      />
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <AdminTopBar actor={{ name: displayName, email: admin.email, avatar }} languages={languages as never} />
<div className="flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
}
