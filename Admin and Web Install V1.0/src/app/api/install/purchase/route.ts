import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyLicense } from "@/features/install/license";
import { getInstallState, markStepCompleted, writeInstallState } from "@/features/install/status";
import { STEP } from "@/features/install/config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  // All required, no whitespace, max 191.
  username: z.string().min(1).max(191).regex(/^\S*$/, "Username cannot contain spaces."),
  purchaseKey: z.string().min(1).max(191).regex(/^\S*$/, "Purchase code cannot contain spaces."),
  // Domain to register the license against — pre-filled from the browser host.
  domain: z.string().min(1, "Domain is required.").max(191),
  name: z.string().min(1, "Name is required.").max(191),
  email: z.string().min(1, "Email is required.").email("Enter a valid email.").max(191),
});

/**
 * Step 3 — license activation.
 * Requires the database step so the result can be persisted.
 */
export async function POST(req: NextRequest) {
  const state = await getInstallState();
  if (state.installed) {
    return NextResponse.json({ error: "Already installed." }, { status: 403 });
  }
  if (state.step < STEP.database) {
    return NextResponse.json({ error: "Complete the database step first." }, { status: 409 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const host = req.headers.get("host") ?? "";
  const domain = parsed.data.domain.trim();
  const name = parsed.data.name.trim();
  const email = parsed.data.email.trim();

  const result = await verifyLicense({
    username: parsed.data.username,
    purchaseKey: parsed.data.purchaseKey,
    host,
    domain,
    name,
    email,
  });

  if (!result.active) {
    return NextResponse.json(
      {
        error: result.errors[0] ?? "We couldn't verify this purchase code for this domain.",
        errors: result.errors,
      },
      { status: 422 },
    );
  }

  // Persist the verified credentials + activation baseline so the first
  // runtime re-check has state to re-verify against.
  await writeInstallState({
    buyerUsername: parsed.data.username,
    buyerName: name,
    buyerEmail: email,
    purchaseCode: parsed.data.purchaseKey,
    domain,
    licenseActive: true,
    licenseCheckedAt: new Date(),
    licenseErrors: null,
  });
  await markStepCompleted(STEP.purchase);

  return NextResponse.json({ ok: true });
}
