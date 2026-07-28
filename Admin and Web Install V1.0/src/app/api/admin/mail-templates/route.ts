import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  key:      z.string().min(1).max(100).regex(/^[a-z0-9_]+$/, "Key must be lowercase alphanumeric with underscores"),
  name:     z.string().min(1).max(200),
  subject:  z.string().min(1).max(500),
  body:     z.string().min(1),
  isActive: z.boolean().default(true),
});

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  const templates = await prisma.mailTemplate.findMany({
    orderBy: { key: "asc" },
  });

  return NextResponse.json({ templates });
}

export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  try {
    const template = await prisma.mailTemplate.create({ data: parsed.data });
    return NextResponse.json({ template }, { status: 201 });
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && (e as { code: string }).code === "P2002") {
      return NextResponse.json({ error: "A template with that key already exists." }, { status: 409 });
    }
    throw e;
  }
}
