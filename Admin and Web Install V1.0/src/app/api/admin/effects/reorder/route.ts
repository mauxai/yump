import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

const schema = z.object({
  order: z.array(z.object({ id: z.string(), sortOrder: z.number().int() })).min(1),
});

export async function PUT(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  await prisma.$transaction(
    parsed.data.order.map(({ id, sortOrder }) =>
      prisma.effectPreset.update({ where: { id }, data: { sortOrder } })
    )
  );

  return NextResponse.json({ ok: true });
}
