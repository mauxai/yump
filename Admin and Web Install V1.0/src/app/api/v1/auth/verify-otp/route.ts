import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { email, otp } = await req.json().catch(() => ({}));

  if (!email || !otp) {
    return NextResponse.json({ error: "Email and OTP are required." }, { status: 400 });
  }

  const normalizedEmail = (email as string).toLowerCase().trim();
  const otpStr = String(otp).trim();

  // Admins take priority — check admins first
  const admin = await prisma.admin.findUnique({ where: { email: normalizedEmail } });
  const user  = !admin
    ? await prisma.user.findUnique({ where: { email: normalizedEmail } })
    : null;

  const accountId   = admin?.id ?? user?.id;
  const accountKind = admin ? "admin" : user ? "user" : null;

  if (!accountId || !accountKind) {
    return NextResponse.json({ error: "Invalid or expired code." }, { status: 400 });
  }

  const rows = await prisma.$queryRawUnsafe<Array<{
    id: string; otp: string | null; token: string; expires_at: Date; used_at: Date | null;
  }>>(
    `SELECT id, otp, token, expires_at, used_at FROM password_reset_tokens
     WHERE user_id = ? AND kind = ? AND used_at IS NULL
     ORDER BY created_at DESC LIMIT 1`,
    accountId,
    accountKind,
  );

  const row = rows[0];

  if (!row || !row.otp || row.used_at || new Date(row.expires_at) < new Date()) {
    return NextResponse.json({ error: "Invalid or expired code." }, { status: 400 });
  }

  const valid = await bcrypt.compare(otpStr, row.otp);
  if (!valid) {
    return NextResponse.json({ error: "Incorrect code. Please try again." }, { status: 400 });
  }

  return NextResponse.json({ ok: true, token: row.token, kind: accountKind });
}
