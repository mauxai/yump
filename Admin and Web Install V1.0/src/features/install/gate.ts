import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware install gate.
 *
 * Middleware runs on the edge runtime where Prisma is unavailable, so the
 * gate asks the node-runtime status route (which reads the installations
 * table) whether the app is installed. Fail-closed: if the status can't be
 * determined — DB down, schema missing, status route erroring — every
 * request is routed to /install. This holds in `next dev` and `next start`
 * alike; there is no run mode that skips the wizard.
 *
 * "installed" is cached in module scope once observed: installation is
 * one-way, so after the first positive answer the gate costs nothing.
 */

let installedCache = false;

function isInstallPath(pathname: string): boolean {
  return (
    pathname === "/install" ||
    pathname.startsWith("/install/") ||
    pathname === "/api/install" ||
    pathname.startsWith("/api/install/")
  );
}

export async function installGate(req: NextRequest): Promise<NextResponse | null> {
  const { pathname } = req.nextUrl;

  // The status route itself (and everything under /api/install) must stay
  // reachable pre-install, and must never recurse into the gate.
  if (pathname.startsWith("/api/install")) return null;

  if (!installedCache) {
    try {
      const res = await fetch(new URL("/api/install/status", req.nextUrl.origin), {
        headers: { accept: "application/json" },
        cache: "no-store",
      });
      const data = (await res.json()) as { installed?: boolean };
      installedCache = data.installed === true;
    } catch {
      installedCache = false;
    }
  }

  if (installedCache) {
    // Installed systems don't expose the wizard.
    if (isInstallPath(pathname)) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return null;
  }

  // Not installed: only the wizard is reachable.
  if (isInstallPath(pathname)) return null;
  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "Application is not installed. Complete the installer at /install." },
      { status: 503 },
    );
  }
  return NextResponse.redirect(new URL("/install", req.url));
}
