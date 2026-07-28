import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSettingsMap } from "@/lib/settings";
import { signToken } from "@/lib/jwt";
import { buildAvatarUrl } from "@/lib/storage-url";
import { sendTemplateMail } from "@/lib/mailer";

const schema = z.object({
  provider: z.enum(["google", "facebook", "apple"]).default("google"),
  email: z.string().email(),
  name: z.string().min(1).max(80).optional(),
  image: z.string().url().optional().nullable(),
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

  const { email, name, image } = parsed.data;

  const existing = await prisma.user.findUnique({
    where: { email },
    select: {
      id:           true,
      email:        true,
      name:         true,
      avatar:       true,
      status:       true,
      creditsUsed:  true,
      creditsTotal: true,
    },
  });

  // Suspended user — reject
  if (existing?.status === "suspended") {
    return NextResponse.json(
      { error: "Your account has been suspended." },
      { status: 403 },
    );
  }

  if (existing) {
    // Update avatar if provider supplies one
    if (image) {
      await prisma.user
        .update({ where: { email }, data: { avatar: image, lastActiveAt: new Date() } })
        .catch(() => {});
    } else {
      await prisma.user
        .update({ where: { email }, data: { lastActiveAt: new Date() } })
        .catch(() => {});
    }

    const token = await signToken({
      sub:   existing.id,
      email: existing.email,
      name:  existing.name,
      kind:  "user",
    });

    return NextResponse.json({
      token,
      expiresIn:  "7d",
      tokenType:  "Bearer",
      isNewUser:  false,
      user: {
        ...existing,
        avatar: image ? buildAvatarUrl(image) : buildAvatarUrl(existing.avatar),
        kind: "user",
      },
    });
  }

  // ── New user — register ──────────────────────────────────────────────────
  const settings = await getSettingsMap().catch(() => ({} as Record<string, string>));
  const freeCreditEnabled = settings["business.free_credit_enabled"] === "true";
  const freeCreditAmount  = parseInt(settings["business.free_credit_amount"] ?? "0", 10);
  const creditsTotal      = freeCreditEnabled && freeCreditAmount > 0 ? freeCreditAmount : 10;

  const userName = name ?? email.split("@")[0];

  const user = await prisma.user.create({
    data: {
      email,
      name:         userName,
      passwordHash: "",
      avatar:       image ?? null,
      creditsTotal,
    },
    select: {
      id:           true,
      email:        true,
      name:         true,
      avatar:       true,
      status:       true,
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

  // Fire-and-forget welcome email
  sendTemplateMail(user.email, "welcome", {
    brand_name: settings["brand.name"] || "6amStudio",
    user_name:  userName,
    user_email: user.email,
    app_url:    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  }).catch(() => null);

  return NextResponse.json(
    {
      token,
      expiresIn:  "7d",
      tokenType:  "Bearer",
      isNewUser:  true,
      user: { ...user, avatar: buildAvatarUrl(user.avatar), kind: "user" },
    },
    { status: 201 },
  );
}
