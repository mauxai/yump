import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { MailTemplatesManager } from "./MailTemplatesManager";

export const dynamic = "force-dynamic";

export default async function MailTemplatesPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  const templates = await prisma.mailTemplate.findMany({ orderBy: { key: "asc" } });

  return <MailTemplatesManager initial={templates} />;
}
