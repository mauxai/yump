import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { NewTemplateContent } from "./NewTemplateContent";

export const dynamic = "force-dynamic";

export default async function NewTemplatePage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  const [categories, models] = await Promise.all([
    prisma.templateCategory.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.aiModel.findMany({
      where: { isActive: true },
      select: { id: true, label: true, modelId: true, isDefault: true, provider: true },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  return (
    <NewTemplateContent
      categories={categories}
      models={models}
    />
  );
}
