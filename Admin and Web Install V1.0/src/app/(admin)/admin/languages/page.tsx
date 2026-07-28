import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { LanguageManager } from "./LanguageManager";

export const dynamic = "force-dynamic";

export default async function AdminLanguagesPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  const languages = await prisma.language.findMany({
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  return <LanguageManager languages={languages} />;
}
