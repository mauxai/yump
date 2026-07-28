import { NextResponse } from "next/server";

/**
 * POST /api/auth/logout
 * API-side logout: clears the auth_token cookie (if any) and returns success.
 * For panel users, sign out via NextAuth's /api/auth/signout instead.
 */
export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set("auth_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
