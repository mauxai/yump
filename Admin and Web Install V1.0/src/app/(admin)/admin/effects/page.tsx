import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { EffectsManager } from "./EffectsManager";

export const dynamic = "force-dynamic";

export default async function AdminEffectsPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  const presets = await prisma.effectPreset.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return <EffectsManager initial={presets} />;
}
