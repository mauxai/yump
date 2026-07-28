import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toAbsoluteUrl } from "@/lib/utils/url";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId") ?? undefined;
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "50", 10) || 50);

  const templates = await prisma.template.findMany({
    where: { isActive: true, ...(categoryId ? { categoryId } : {}) },
    select: {
      id: true,
      title: true,
      description: true,
      imageUrl: true,
      prompt: true,
      category: { select: { id: true, name: true } },
      sortOrder: true,
      usageCount: true,
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take: limit,
  });

  return NextResponse.json({
    templates: templates.map((t) => ({
      ...t,
      imageUrl:     toAbsoluteUrl(t.imageUrl),
      categoryId:   t.category?.id ?? null,
      categoryName: t.category?.name ?? null,
      category:     undefined,
    })),
  });
}
