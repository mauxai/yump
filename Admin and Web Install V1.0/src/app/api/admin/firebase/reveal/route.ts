import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { getSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";

// Returns the raw (unmasked) firebase.privateKey — admin only.
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  const raw = await getSetting("firebase.privateKey", "");
  return NextResponse.json({ value: raw });
}
