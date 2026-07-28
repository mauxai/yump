import { NextRequest, NextResponse } from "next/server";
import { getActivationStatus } from "@/features/install/activation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * License activation status for the edge middleware gate.
 *
 * Mirrors the install-status route: middleware runs on the edge where Prisma
 * is unavailable, so it asks this Node route whether the stored license is
 * still active (24h-cached, fail-open).
 */
export async function GET(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  const active = await getActivationStatus(host);
  return NextResponse.json({ active });
}
