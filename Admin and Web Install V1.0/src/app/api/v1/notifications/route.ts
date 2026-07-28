import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit  = Math.min(100, parseInt(searchParams.get("limit") ?? "20", 10) || 20);
  const page   = Math.max(1,   parseInt(searchParams.get("page")  ?? "1",  10) || 1);
  const offset = (page - 1) * limit;

  const [rows, unreadResult, totalResult] = await Promise.all([
    prisma.$queryRaw<{
      id: string; title: string; body: string;
      data: unknown; is_read: number; created_at: Date;
    }[]>`
      SELECT id, title, body, data, is_read, created_at
      FROM notifications
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `,
    prisma.$queryRaw<[{ cnt: bigint }]>`
      SELECT COUNT(*) AS cnt FROM notifications WHERE user_id = ${userId} AND is_read = 0
    `,
    prisma.$queryRaw<[{ cnt: bigint }]>`
      SELECT COUNT(*) AS cnt FROM notifications WHERE user_id = ${userId}
    `,
  ]);

  const total      = Number(totalResult[0]?.cnt ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return NextResponse.json({
    notifications: rows.map((r) => ({
      id:        r.id,
      title:     r.title,
      body:      r.body,
      data:      typeof r.data === "string" ? JSON.parse(r.data) : (r.data ?? null),
      isRead:    r.is_read === 1,
      createdAt: r.created_at,
    })),
    unreadCount: Number(unreadResult[0]?.cnt ?? 0),
    total,
    totalPages,
    page,
  });
}
