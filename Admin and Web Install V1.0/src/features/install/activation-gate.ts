import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware activation gate (edge runtime).
 *
 * Equivalent of the Laravel `VerifyActivation` middleware: once installed,
 * authenticated sessions are gated on the license. The license state lives in
 * the DB (Prisma is unavailable on the edge), so the gate asks the
 * node-runtime /api/activation/status route, which does the 24h-cached
 * re-verification. On a definitive "inactive" the request is redirected to the
 * internal /activation/inactive page.
 *
 * Fail-open: a status route that can't be reached reports active. The license
 * is per-deployment (not per-user), so the result is cached in module scope
 * for a short window to avoid a subrequest on every navigation.
 */

let cache: { active: boolean; at: number } | null = null;
// Re-ask the node route at most this often; the route itself enforces the
// authoritative 24h re-verification TTL.
const GATE_TTL_MS = 1000 * 60 * 10;

export async function activationGate(req: NextRequest): Promise<NextResponse | null> {
  const { pathname } = req.nextUrl;

  // The inactive page must stay reachable, and API/auth traffic is never
  // redirected (a redirect would corrupt JSON responses / auth flows).
  if (pathname.startsWith("/activation")) return null;
  if (pathname.startsWith("/api/")) return null;

  if (!cache || Date.now() - cache.at > GATE_TTL_MS) {
    try {
      const res = await fetch(new URL("/api/activation/status", req.nextUrl.origin), {
        headers: { accept: "application/json" },
        cache: "no-store",
      });
      const data = (await res.json()) as { active?: boolean };
      cache = { active: data.active !== false, at: Date.now() };
    } catch {
      cache = { active: true, at: Date.now() };
    }
  }

  if (!cache.active) {
    return NextResponse.redirect(new URL("/activation/inactive", req.url));
  }
  return null;
}
