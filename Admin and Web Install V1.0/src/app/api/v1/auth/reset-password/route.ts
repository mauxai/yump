import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { token, password } = await req.json().catch(() => ({}));

  if (!token || !password || password.length < 8) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const rows = await prisma.$queryRawUnsafe<Array<{
    id: string; user_id: string; kind: string; expires_at: Date; used_at: Date | null;
  }>>(
    `SELECT id, user_id, kind, expires_at, used_at FROM password_reset_tokens WHERE token = ? LIMIT 1`,
    token,
  );

  const row = rows[0];
  if (!row || row.used_at || new Date(row.expires_at) < new Date()) {
    return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  if (row.kind === "admin") {
    await prisma.$executeRawUnsafe(
      `UPDATE admins SET password_hash = ?, updated_at = NOW() WHERE id = ?`,
      passwordHash,
      row.user_id,
    );
  } else {
    await prisma.$executeRawUnsafe(
      `UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?`,
      passwordHash,
      row.user_id,
    );
  }

  await prisma.$executeRawUnsafe(
    `UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?`,
    row.id,
  );

  return NextResponse.json({ ok: true, kind: row.kind });
}
