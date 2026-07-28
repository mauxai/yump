import { getSettingsMap } from "@/lib/settings";
import { prisma } from "@/lib/prisma";

export type MailVars = {
  brand_name?: string;
  brand_color?: string;
  user_name?: string;
  user_email?: string;
  reset_url?: string;
  otp?: string;
  amount?: string;
  currency?: string;
  plan_name?: string;
  credits?: string;
  date?: string;
  app_url?: string;
};

function replacePlaceholders(text: string, vars: MailVars): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return (vars as Record<string, string | undefined>)[key] ?? `{{${key}}}`;
  });
}

/**
 * Send an email using a DB template identified by `templateKey`.
 * Falls back to `fallback` subject/html if no active template is found.
 */
export async function sendTemplateMail(
  to: string,
  templateKey: string,
  vars: MailVars,
  fallback?: { subject: string; html: string },
): Promise<{ ok: boolean; error?: string }> {
  const s = await getSettingsMap();

  const host = s["smtp.host"];
  const port = parseInt(s["smtp.port"] || "587", 10);
  const smtpUser = s["smtp.user"];
  const pass = s["smtp.pass"];
  const from = s["smtp.from"] || smtpUser;
  const secure = s["smtp.secure"] === "true";

  if (!host || !smtpUser || !pass) {
    return { ok: false, error: "SMTP is not configured." };
  }

  // Inject brand_name from settings if not provided
  const resolvedVars: MailVars = {
    brand_name: s["brand.name"] || "6amStudio",
    brand_color: s["brand.primaryDark"] || "#18181b",
    app_url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    ...vars,
  };

  let subject: string;
  let html: string;

  // Try to load template from DB
  const template = await prisma.mailTemplate.findUnique({
    where: { key: templateKey, isActive: true },
  }).catch(() => null);

  if (template) {
    subject = replacePlaceholders(template.subject, resolvedVars);
    html = replacePlaceholders(template.body, resolvedVars);
  } else if (fallback) {
    subject = fallback.subject;
    html = fallback.html;
  } else {
    return { ok: false, error: `No template found for key "${templateKey}" and no fallback provided.` };
  }

  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.default.createTransport({ host, port, secure, auth: { user: smtpUser, pass } });
    await transporter.sendMail({ from, to, subject, html });
    return { ok: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : "Unknown SMTP error";
    return { ok: false, error };
  }
}
