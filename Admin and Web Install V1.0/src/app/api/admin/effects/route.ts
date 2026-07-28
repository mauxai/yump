import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  label:         z.string().min(1).max(100),
  icon:          z.string().min(1).max(50),
  prompt:        z.string().min(1),
  category:      z.string().min(1).max(50),
  categoryColor: z.string().min(1).max(50),
  sortOrder:     z.number().int().default(0),
  isActive:      z.boolean().default(true),
});

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  const presets = await prisma.effectPreset.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ presets });
}

export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const preset = await prisma.effectPreset.create({ data: parsed.data });
  return NextResponse.json({ preset }, { status: 201 });
}
