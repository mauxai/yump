import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  label:         z.string().min(1).max(100).optional(),
  icon:          z.string().min(1).max(50).optional(),
  prompt:        z.string().min(1).optional(),
  category:      z.string().min(1).max(50).optional(),
  categoryColor: z.string().min(1).max(50).optional(),
  sortOrder:     z.number().int().optional(),
  isActive:      z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const preset = await prisma.effectPreset.update({
    where: { id: params.id },
    data: parsed.data,
  });

  return NextResponse.json({ preset });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  await prisma.effectPreset.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
