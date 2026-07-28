import { redirect } from "next/navigation";

/**
 * Clears all NextAuth session cookies via /api/auth/clear and redirects to `to`.
 * Use from Server Components when a logged-in session points at a DB record that
 * no longer exists — prevents the "cookie says logged-in, DB says gone" loop.
 * Returns `never` so TypeScript narrows the caller's local variables correctly.
 */
export function clearSessionAndRedirect(to: string): never {
  const safe = to.startsWith("/") ? to : "/login";
  redirect(`/api/auth/clear?to=${encodeURIComponent(safe)}`);
}
