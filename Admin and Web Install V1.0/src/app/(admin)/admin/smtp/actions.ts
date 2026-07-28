"use server";
import { requireAdmin } from "@/lib/auth-helpers";
import { upsertSettings, getSettingsMap } from "@/lib/settings";
import { logAdminAction } from "@/lib/audit";

export async function saveSmtpSettings(fields: {
  host: string;
  port: string;
  user: string;
  pass: string;
  from: string;
  secure: string;
}): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Unauthorized" };

  const before = await getSettingsMap();

  await upsertSettings([
    { key: "smtp.host",   value: fields.host,   category: "smtp" },
    { key: "smtp.port",   value: fields.port,   category: "smtp" },
    { key: "smtp.user",   value: fields.user,   category: "smtp" },
    { key: "smtp.pass",   value: fields.pass,   category: "smtp" },
    { key: "smtp.from",   value: fields.from,   category: "smtp" },
    { key: "smtp.secure", value: fields.secure, category: "smtp" },
  ]);

  await logAdminAction(admin.id, "SETTINGS_UPDATE", {
    before: {
      "smtp.host": before["smtp.host"] ?? "",
      "smtp.port": before["smtp.port"] ?? "",
      "smtp.user": before["smtp.user"] ?? "",
      "smtp.from": before["smtp.from"] ?? "",
    },
    after: {
      "smtp.host": fields.host,
      "smtp.port": fields.port,
      "smtp.user": fields.user,
      "smtp.from": fields.from,
    },
  });

  return { ok: true };
}

export async function sendTestEmail(
  to: string,
): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Unauthorized" };

  const s = await getSettingsMap();
  const host   = s["smtp.host"];
  const port   = parseInt(s["smtp.port"] || "587", 10);
  const user   = s["smtp.user"];
  const pass   = s["smtp.pass"];
  const from   = s["smtp.from"] || user;
  const secure = s["smtp.secure"] === "true";

  if (!host || !user || !pass) {
    return { ok: false, error: "SMTP is not fully configured. Save your settings first." };
  }
  if (!to || !to.includes("@")) {
    return { ok: false, error: "Enter a valid recipient email address." };
  }

  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.default.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from,
      to,
      subject: "SMTP Test — 6amStudio",
      text: "This is a test email sent from the 6amStudio admin panel to verify your SMTP configuration.",
      html: `<p style="font-family:sans-serif;font-size:14px;color:#333">
        This is a test email sent from the <strong>6amStudio admin panel</strong> to verify your SMTP configuration.<br/><br/>
        If you received this, your SMTP settings are working correctly.
      </p>`,
    });

    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: msg };
  }
}
