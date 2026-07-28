import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { sendTestEmail } from "@/app/(admin)/admin/smtp/actions";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  let to: string;
  try {
    const body = await req.json();
    to = body.to;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!to || !to.includes("@")) {
    return NextResponse.json({ error: "Enter a valid recipient email address." }, { status: 400 });
  }

  const result = await sendTestEmail(to);
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Failed to send." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
