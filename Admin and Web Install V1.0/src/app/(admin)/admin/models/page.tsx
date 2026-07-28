import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { ModelsContent } from "./ModelsContent";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

export default async function AdminModelsPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string; provider?: string };
}) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  const q = (searchParams.q ?? "").trim();
  const providerFilter = (searchParams.provider ?? "").trim().toLowerCase();
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);

  const where = {
    AND: [
      q
        ? {
            OR: [
              { label: { contains: q } },
              { provider: { contains: q } },
              { modelId: { contains: q } },
            ],
          }
        : {},
      providerFilter ? { provider: providerFilter } : {},
    ],
  };

  const [total, models, allProviders] = await Promise.all([
    prisma.aiModel.count({ where }),
    prisma.aiModel.findMany({
      where,
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.aiModel.findMany({
      select: { provider: true },
      distinct: ["provider"],
      orderBy: { provider: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const serializedModels = models.map((m) => ({
    id: m.id,
    label: m.label,
    provider: m.provider,
    modelId: m.modelId,
    credentials: (m.credentials as Record<string, string> | null) ?? null,
    creditCost: m.creditCost,
    isActive: m.isActive,
    isDefault: m.isDefault,
  }));

  return (
    <ModelsContent
      models={serializedModels}
      total={total}
      totalPages={totalPages}
      page={page}
      q={q}
      providerFilter={providerFilter}
      allProviders={allProviders}
    />
  );
}
