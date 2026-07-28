import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { TemplatesContent } from "./TemplatesContent";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

export default async function AdminTemplatesPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string; categoryId?: string };
}) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  const q          = (searchParams.q ?? "").trim();
  const categoryId = (searchParams.categoryId ?? "").trim();
  const page       = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);

  const where = {
    AND: [
      q          ? { OR: [{ title: { contains: q } }, { prompt: { contains: q } }] } : {},
      categoryId ? { categoryId } : {},
    ],
  };

  const [total, templates, allCategories] = await Promise.all([
    prisma.template.count({ where }),
    prisma.template.findMany({
      where,
      include: { category: { select: { id: true, name: true } } },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.templateCategory.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <TemplatesContent
      templates={templates.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        imageUrl: t.imageUrl,
        prompt: t.prompt,
        categoryId: t.categoryId ?? "",
        categoryName: t.category?.name ?? "",
        isActive: t.isActive,
        sortOrder: t.sortOrder,
        usageCount: t.usageCount,
        createdAt: t.createdAt.toISOString(),
      }))}
      total={total}
      totalPages={Math.ceil(total / PAGE_SIZE)}
      page={page}
      q={q}
      categoryId={categoryId}
      allCategories={allCategories}
    />
  );
}
