import { signOut } from "@/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/clear?to=/login
 * Calls NextAuth signOut (which knows the exact cookie names/attributes) and
 * redirects to `to`. Safe to reach from server-component redirect() calls.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const to = searchParams.get("to") ?? "/login";
  const dest = to.startsWith("/") ? to : "/login";

  // signOut in a Route Handler is allowed to modify cookies.
  // It throws NEXT_REDIRECT internally; Next.js converts that to a proper
  // redirect response with Set-Cookie headers that clear the session token.
  await signOut({ redirectTo: dest });

  // Fallback — only reached if signOut doesn't throw (shouldn't happen).
  return NextResponse.redirect(new URL(dest, req.url));
}
