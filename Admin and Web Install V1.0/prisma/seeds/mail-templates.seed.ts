const TEMPLATES = [
  {
    key:     "forgot_password",
    name:    "Forgot Password",
    subject: "Reset your {{brand_name}} password",
    body: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;border:1px solid #e4e4e7;overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="background:{{brand_color}};padding:28px 32px;">
            <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">{{brand_name}}</p>
          </td>
        </tr>
        <!-- Body -->
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
        <!-- Footer -->
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
</html>`,
  },
  {
    key:     "billing_confirmation",
    name:    "Billing Confirmation",
    subject: "Payment confirmed — {{plan_name}} plan",
    body: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;border:1px solid #e4e4e7;overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="background:{{brand_color}};padding:28px 32px;">
            <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">{{brand_name}}</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#09090b;letter-spacing:-0.4px;">Payment confirmed</h1>
            <p style="margin:0 0 28px;font-size:15px;color:#52525b;line-height:1.6;">
              Hi {{user_name}}, your payment was successful. Here&rsquo;s your receipt.
            </p>
            <!-- Receipt box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e4e4e7;border-radius:10px;overflow:hidden;margin-bottom:28px;">
              <tr style="background:#fafafa;">
                <td colspan="2" style="padding:14px 20px;font-size:13px;font-weight:600;color:#52525b;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #e4e4e7;">
                  Receipt
                </td>
              </tr>
              <tr>
                <td style="padding:14px 20px;font-size:14px;color:#52525b;border-bottom:1px solid #f4f4f5;">Plan</td>
                <td style="padding:14px 20px;font-size:14px;font-weight:600;color:#09090b;text-align:right;border-bottom:1px solid #f4f4f5;">{{plan_name}}</td>
              </tr>
              <tr>
                <td style="padding:14px 20px;font-size:14px;color:#52525b;border-bottom:1px solid #f4f4f5;">Amount</td>
                <td style="padding:14px 20px;font-size:14px;font-weight:600;color:#09090b;text-align:right;border-bottom:1px solid #f4f4f5;">{{currency}} {{amount}}</td>
              </tr>
              <tr>
                <td style="padding:14px 20px;font-size:14px;color:#52525b;border-bottom:1px solid #f4f4f5;">Credits added</td>
                <td style="padding:14px 20px;font-size:14px;font-weight:600;color:#16a34a;text-align:right;border-bottom:1px solid #f4f4f5;">+{{credits}}</td>
              </tr>
              <tr>
                <td style="padding:14px 20px;font-size:14px;color:#52525b;">Date</td>
                <td style="padding:14px 20px;font-size:14px;font-weight:500;color:#09090b;text-align:right;">{{date}}</td>
              </tr>
            </table>
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="border-radius:8px;background:{{brand_color}};">
                  <a href="{{app_url}}"
                     style="display:inline-block;padding:13px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
                    Open {{brand_name}}
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Footer -->
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
</html>`,
  },
  {
    key:     "welcome",
    name:    "Welcome",
    subject: "Welcome to {{brand_name}}!",
    body: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;border:1px solid #e4e4e7;overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="background:{{brand_color}};padding:28px 32px;">
            <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">{{brand_name}}</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#09090b;letter-spacing:-0.4px;">Welcome to {{brand_name}}! 🎉</h1>
            <p style="margin:0 0 16px;font-size:15px;color:#52525b;line-height:1.6;">
              Hi {{user_name}}, we&rsquo;re thrilled to have you on board.
              {{brand_name}} lets you transform your images with AI — enhance, edit, and apply effects in seconds.
            </p>
            <p style="margin:0 0 28px;font-size:15px;color:#52525b;line-height:1.6;">
              Get started by uploading your first image and exploring the editor.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="border-radius:8px;background:{{brand_color}};">
                  <a href="{{app_url}}"
                     style="display:inline-block;padding:13px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
                    Open {{brand_name}}
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:0;font-size:13px;color:#71717a;line-height:1.6;">
              If you have any questions, just reply to this email — we&rsquo;re happy to help.
            </p>
          </td>
        </tr>
        <!-- Footer -->
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
</html>`,
  },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function seedMailTemplates(prisma: any): Promise<number> {
  for (const t of TEMPLATES) {
    await prisma.mailTemplate.upsert({
      where:  { key: t.key },
      update: { name: t.name, subject: t.subject, body: t.body },
      create: { key: t.key, name: t.name, subject: t.subject, body: t.body, isActive: true },
    });
  }
  return TEMPLATES.length;
}
