import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getInstallState, finalizeInstallation } from "@/features/install/status";
import { STEP } from "@/features/install/config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z
  .object({
    name: z.string().min(1).max(120),
    email: z.string().email().max(191),
    password: z.string().min(8).max(191),
    passwordConfirmation: z.string(),
  })
  .refine((d) => d.password === d.passwordConfirmation, {
    message: "Passwords do not match.",
    path: ["passwordConfirmation"],
  });

/**
 * Step 4 — super admin + finalize.
 * Creating the admin and flipping install.installed are the last acts of
 * the wizard; from the next request the middleware gate lets the app run
 * and blocks /install.
 */
export async function POST(req: NextRequest) {
  const state = await getInstallState();
  if (state.installed) {
    return NextResponse.json({ error: "Already installed." }, { status: 403 });
  }
  if (state.step < STEP.purchase) {
    return NextResponse.json({ error: "Verify your purchase code first." }, { status: 409 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const { name, email, password } = parsed.data;

  try {
    const existing = await prisma.admin.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An admin with this email already exists." },
        { status: 422 },
      );
    }
    await prisma.admin.create({
      data: {
        name,
        email,
        passwordHash: await bcrypt.hash(password, 10),
        role: "superadmin",
      },
    });
    await finalizeInstallation();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Admin account creation failed." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, loginUrl: "/admin/login" });
}
