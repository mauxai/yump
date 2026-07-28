import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/jwt";
import { buildAvatarUrl } from "@/lib/storage-url";

const schema = z.object({
  email:    z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

/**
 * POST /api/auth/login
 * Returns a signed JWT token + user profile as JSON.
 * Use the token as: Authorization: Bearer <token>
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { email, password } = parsed.data;

  // ── Check user table ────────────────────────────────────────────
  const user = await prisma.user.findUnique({
    where:  { email },
    select: {
      id:           true,
      name:         true,
      email:        true,
      avatar:    true,
      passwordHash: true,
      status:       true,
      creditsUsed:  true,
      creditsTotal: true,
    },
  });

  if (user) {
    if (user.status === "suspended") {
      return NextResponse.json(
        { error: "Account suspended. Contact support." },
        { status: 403 },
      );
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data:  { lastActiveAt: new Date() },
    });

    const token = await signToken({
      sub:   user.id,
      email: user.email,
      name:  user.name,
      kind:  "user",
    });

    const { passwordHash: _, ...safeUser } = user;

    return NextResponse.json({
      token,
      expiresIn: "7d",
      tokenType: "Bearer",
      user: { ...safeUser, avatar: buildAvatarUrl(safeUser.avatar), kind: "user" },
    });
  }

  // ── Check admin table ────────────────────────────────────────────
  const admin = await prisma.admin.findUnique({
    where:  { email },
    select: {
      id:           true,
      name:         true,
      email:        true,
      passwordHash: true,
      role:         true,
    },
  });

  if (admin) {
    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = await signToken({
      sub:   admin.id,
      email: admin.email,
      name:  admin.name,
      kind:  "admin",
      role:  admin.role as "admin" | "superadmin",
    });

    const { passwordHash: _, ...safeAdmin } = admin;

    return NextResponse.json({
      token,
      expiresIn: "7d",
      tokenType: "Bearer",
      user: { ...safeAdmin, kind: "admin" },
    });
  }

  return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
}
