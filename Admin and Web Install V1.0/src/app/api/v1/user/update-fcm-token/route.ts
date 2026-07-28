import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

const schema = z.object({
  fcm_token: z.string().min(10).max(4096),
});

export async function POST(req: Request) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  await prisma.$executeRaw`
    UPDATE users SET fcm_token = ${parsed.data.fcm_token} WHERE id = ${userId}
  `;

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.$executeRaw`
    UPDATE users SET fcm_token = NULL WHERE id = ${userId}
  `;

  return NextResponse.json({ ok: true });
}
