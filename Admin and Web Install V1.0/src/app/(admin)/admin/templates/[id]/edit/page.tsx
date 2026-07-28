import { redirect, notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { EditTemplateContent } from "./EditTemplateContent";

export const dynamic = "force-dynamic";

export default async function EditTemplatePage({ params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  const [template, categories, models] = await Promise.all([
    prisma.template.findUnique({
      where: { id: params.id },
      include: { category: { select: { id: true, name: true } } },
    }),
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

  if (!template) notFound();

  return (
    <EditTemplateContent
      categories={categories}
      models={models}
      template={{
        id: template.id,
        title: template.title,
        description: template.description,
        imageUrl: template.imageUrl,
        prompt: template.prompt,
        categoryId: template.categoryId ?? "",
        sortOrder: template.sortOrder,
        isActive: template.isActive,
      }}
    />
  );
}
