import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

// POST /api/v1/notifications/read
// Body: { id?: string }  — omit id to mark ALL as read
export async function POST(req: Request) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const id   = typeof body?.id === "string" ? body.id : null;

  if (id) {
    await prisma.$executeRaw`
      UPDATE notifications SET is_read = 1
      WHERE id = ${id} AND user_id = ${userId}
    `;
  } else {
    await prisma.$executeRaw`
      UPDATE notifications SET is_read = 1 WHERE user_id = ${userId}
    `;
  }

  return NextResponse.json({ ok: true });
}
