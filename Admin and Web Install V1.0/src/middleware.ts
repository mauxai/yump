import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";
import { installGate } from "@/features/install/gate";
import { activationGate } from "@/features/install/activation-gate";

const { auth } = NextAuth(authConfig);

const PUBLIC_PATHS = [
  "/install",
  "/api/install",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/admin/login",
  "/activation",        // internal license-inactive page — reachable without a redirect loop
  "/api/activation",    // license-status route the activation gate sub-fetches (no cookies)
  "/api/auth",
  "/api/messages",    // public translation files — no auth needed
  "/api/v1",          // all v1 API routes — handlers enforce auth via JWT Bearer or session
  "/api/openapi.json",
  "/api/swagger-ui",
  "/api-docs",
];

export default auth(async (req) => {
  // Installation gate runs before everything: until the install wizard has
  // completed (in any run mode — dev or build), all traffic is redirected
  // to /install; afterwards /install is sealed off.
  const gateResponse = await installGate(req);
  if (gateResponse) return gateResponse;

  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const isLoggedIn = !!req.auth;
  const kind = (req.auth?.user as { kind?: string } | undefined)?.kind;

  const isAdminArea = pathname.startsWith("/admin") && pathname !== "/admin/login";

  if (!isLoggedIn && !isPublic) {
    const loginUrl = isAdminArea ? "/admin/login" : "/login";
    return NextResponse.redirect(new URL(loginUrl, req.url));
  }

  if (isLoggedIn && (pathname === "/login" || pathname === "/register")) {
    const dest = kind === "admin" ? "/admin" : "/";
    return NextResponse.redirect(new URL(dest, req.url));
  }
  if (isLoggedIn && pathname === "/admin/login") {
    const dest = kind === "admin" ? "/admin" : "/";
    return NextResponse.redirect(new URL(dest, req.url));
  }

  if (isAdminArea && kind !== "admin") {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  // License activation gate — mirrors Laravel's VerifyActivation: only
  // authenticated sessions are gated, and a definitive "inactive" license
  // routes to the internal /activation/inactive page (fail-open otherwise).
  if (isLoggedIn && !isPublic) {
    const activationResponse = await activationGate(req);
    if (activationResponse) return activationResponse;
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|storage|images|.*\\.png).*)"],
};
