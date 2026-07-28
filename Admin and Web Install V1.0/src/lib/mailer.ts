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

const DEFAULT_OTP_BODY = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;border:1px solid #e4e4e7;overflow:hidden;">
        <tr>
          <td style="background:{{brand_color}};padding:28px 32px;">
            <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">{{brand_name}}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#09090b;letter-spacing:-0.4px;">Reset your password</h1>
            <p style="margin:0 0 20px;font-size:15px;color:#52525b;line-height:1.6;">
              Hi {{user_name}}, we received a request to reset your <strong>{{brand_name}}</strong> account password.
              Use the verification code below to reset your password. This code expires in <strong>15 minutes</strong>.
            </p>
            <div style="display:inline-block;background:#f4f4f5;border-radius:10px;padding:20px 36px;margin-bottom:24px;text-align:center">
              <span style="font-size:36px;font-weight:700;letter-spacing:12px;color:#18181b;font-family:monospace">{{otp}}</span>
            </div>
            <p style="margin:0 0 8px;font-size:13px;color:#71717a;line-height:1.6;">
              If you didn't request this, you can safely ignore this email — your password won't be changed.
            </p>
            <p style="margin:0;font-size:12px;color:#a1a1aa;">
              Or click here to return to the app:<br>
              <a href="{{reset_url}}" style="color:#16a34a;word-break:break-all;">{{reset_url}}</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #f4f4f5;background:#fafafa;">
            <p style="margin:0;font-size:12px;color:#a1a1aa;text-align:center;">
              &copy; {{brand_name}} &middot; <a href="{{app_url}}" style="color:#71717a;text-decoration:none;">{{app_url}}</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  if (template) {
    let body = template.body;
    if (templateKey === "forgot_password" && !body.includes("{{otp}}")) {
      body = DEFAULT_OTP_BODY;
      prisma.mailTemplate.update({
        where: { id: template.id },
        data: { body: DEFAULT_OTP_BODY },
      }).catch(() => null);
    }
    subject = replacePlaceholders(template.subject, resolvedVars);
    html = replacePlaceholders(body, resolvedVars);
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
