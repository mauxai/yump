import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/templates/categories
 *
 * Returns all template categories with their template count.
 * Use the returned `id` as `categoryId` when calling GET /api/v1/templates.
 */
export async function GET() {
  const categories = await prisma.templateCategory.findMany({
    select: {
      id:   true,
      name: true,
      _count: { select: { templates: { where: { isActive: true } } } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    categories: categories.map((c) => ({
      id:            c.id,
      name:          c.name,
      templateCount: c._count.templates,
    })),
  });
}
