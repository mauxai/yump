import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { getSettingsMap } from "@/lib/settings";

export const dynamic = "force-dynamic";

const schema = z.object({
  to: z.string().email("Invalid email address"),
});

const SAMPLE_VARS: Record<string, string> = {
  brand_name: "6amStudio",
  user_name:  "John Doe",
  user_email: "john@example.com",
  reset_url:  "https://example.com/reset-password?token=sample_token_123",
  amount:     "9.99",
  currency:   "USD",
  plan_name:  "Pro",
  credits:    "500",
  date:       new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
  app_url:    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
};

function replacePlaceholders(text: string): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => SAMPLE_VARS[key] ?? `{{${key}}}`);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const template = await prisma.mailTemplate.findUnique({ where: { id: params.id } });
  if (!template) return NextResponse.json({ error: "Template not found." }, { status: 404 });

  const s = await getSettingsMap();

  // Update sample vars with real brand name
  SAMPLE_VARS.brand_name = s["brand.name"] || "6amStudio";
  SAMPLE_VARS.app_url = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const host     = s["smtp.host"];
  const port     = parseInt(s["smtp.port"] || "587", 10);
  const smtpUser = s["smtp.user"];
  const pass     = s["smtp.pass"];
  const from     = s["smtp.from"] || smtpUser;
  const secure   = s["smtp.secure"] === "true";

  if (!host || !smtpUser || !pass) {
    return NextResponse.json({ error: "SMTP is not configured." }, { status: 500 });
  }

  const subject = replacePlaceholders(template.subject);
  const html    = replacePlaceholders(template.body);

  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.default.createTransport({ host, port, secure, auth: { user: smtpUser, pass } });
    await transporter.sendMail({ from, to: parsed.data.to, subject: `[PREVIEW] ${subject}`, html });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const error = e instanceof Error ? e.message : "Unknown SMTP error";
    return NextResponse.json({ error }, { status: 500 });
  }
}
