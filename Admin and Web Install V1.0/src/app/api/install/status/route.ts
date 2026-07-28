import { NextResponse } from "next/server";
import { getInstallState } from "@/features/install/status";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Installation is one-way, so a positive answer is cached for the process
// lifetime — the middleware gate polls this route on every request until
// the app is installed.
let installedCache = false;

export async function GET() {
  if (installedCache) {
    return NextResponse.json({ installed: true, step: -1, dbReady: true });
  }
  const state = await getInstallState();
  if (state.installed) installedCache = true;
  return NextResponse.json(state);
}
