import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** GET /api/v1/editor/effects
 *  Returns active effect presets grouped by category, ordered by sortOrder.
 */
export async function GET() {
  const presets = await prisma.effectPreset.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, label: true, icon: true, prompt: true, category: true, categoryColor: true },
  });

  // Group by category preserving order
  const map = new Map<string, { title: string; color: string; effects: typeof presets }>();
  for (const p of presets) {
    if (!map.has(p.category)) {
      map.set(p.category, { title: p.category, color: p.categoryColor, effects: [] });
    }
    map.get(p.category)!.effects.push(p);
  }

  return NextResponse.json({ categories: Array.from(map.values()) });
}
