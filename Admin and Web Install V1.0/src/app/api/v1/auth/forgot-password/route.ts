import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSettingsMap } from "@/lib/settings";
import { sendTemplateMail } from "@/lib/mailer";

export async function POST(req: Request) {
  const { email } = await req.json().catch(() => ({}));
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  const admin = await prisma.admin.findUnique({ where: { email: normalizedEmail } });
  const user  = !admin
    ? await prisma.user.findUnique({ where: { email: normalizedEmail } })
    : null;

  const accountId   = admin?.id ?? user?.id;
  const accountKind = admin ? "admin" : user ? "user" : null;

  if (!accountId || !accountKind) {
    return NextResponse.json({ error: "No account found with this email address." }, { status: 404 });
  }

  // Invalidate existing unused tokens
  await prisma.$executeRawUnsafe(
    `DELETE FROM password_reset_tokens WHERE user_id = ? AND kind = ? AND used_at IS NULL`,
    accountId,
    accountKind,
  );

  const otp       = String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
  const otpHash   = await bcrypt.hash(otp, 10);
  const token     = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 15); // 15 minutes

  await prisma.$executeRawUnsafe(
    `INSERT INTO password_reset_tokens (id, user_id, kind, otp, token, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
    crypto.randomUUID(),
    accountId,
    accountKind,
    otpHash,
    token,
    expiresAt,
  );

  const s         = await getSettingsMap();
  const brandName = s["brand.name"] || "6amStudio";
  const userName  = (user?.name ?? admin?.name) || normalizedEmail.split("@")[0];

  const smtpHost = s["smtp.host"];
  const smtpUser = s["smtp.user"];
  const smtpPass = s["smtp.pass"];

  if (!smtpHost || !smtpUser || !smtpPass) {
    return NextResponse.json({ error: "SMTP is not configured. Contact your administrator." }, { status: 500 });
  }

  const fallbackHtml = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#333">
      <h2 style="font-size:20px;font-weight:600;margin-bottom:8px">Reset your password</h2>
      <p style="font-size:14px;color:#666;margin-bottom:24px">
        Hi <strong>${userName}</strong>, use the code below to reset your <strong>${brandName}</strong> password.
        This code expires in <strong>15 minutes</strong>.
      </p>
      <div style="display:inline-block;background:#f4f4f5;border-radius:10px;padding:20px 36px;margin-bottom:24px;text-align:center">
        <span style="font-size:36px;font-weight:700;letter-spacing:12px;color:#18181b;font-family:monospace">${otp}</span>
      </div>
      <p style="font-size:12px;color:#999;margin-top:16px">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
  `;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const resetUrl = `${appUrl}/forgot-password`;

  const result = await sendTemplateMail(
    normalizedEmail,
    "forgot_password",
    { brand_name: brandName, user_name: userName, otp, reset_url: resetUrl, app_url: appUrl },
    { subject: `Your ${brandName} verification code`, html: fallbackHtml },
  );

  if (!result.ok) {
    return NextResponse.json({ error: `SMTP error: ${result.error}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
