import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSettingsMap } from "@/lib/settings";
import { signToken } from "@/lib/jwt";
import { buildAvatarUrl } from "@/lib/storage-url";
import { sendTemplateMail } from "@/lib/mailer";

const schema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { name, email, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email is already registered" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const settings = await getSettingsMap();
  const freeCreditEnabled = settings["business.free_credit_enabled"] === "true";
  const freeCreditAmount = parseInt(settings["business.free_credit_amount"] ?? "0", 10);
  const creditsTotal = freeCreditEnabled && freeCreditAmount > 0 ? freeCreditAmount : 10;

  const user = await prisma.user.create({
    data: { name, email, passwordHash, creditsTotal },
    select: {
      id:          true,
      email:       true,
      name:        true,
      avatar:      true,
      status:      true,
      creditsUsed:  true,
      creditsTotal: true,
    },
  });

  const token = await signToken({
    sub:   user.id,
    email: user.email,
    name:  user.name,
    kind:  "user",
  });

  // Send welcome email (fire-and-forget)
  sendTemplateMail(user.email, "welcome", {
    brand_name: settings["brand.name"] || "6amStudio",
    user_name:  user.name ?? user.email.split("@")[0],
    user_email: user.email,
    app_url:    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  }).catch(() => null);

  return NextResponse.json(
    {
      token,
      expiresIn: "7d",
      tokenType: "Bearer",
      user: { ...user, avatar: buildAvatarUrl(user.avatar), kind: "user" },
    },
    { status: 201 },
  );
}
