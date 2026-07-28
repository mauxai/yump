import { auth } from "@/auth";
import { verifyToken, extractBearerToken } from "@/lib/jwt";

/**
 * Resolves the current user ID from either:
 *   1. A JWT Bearer token in the Authorization header
 *   2. An active NextAuth session cookie
 *
 * Returns null if unauthenticated or not a regular user.
 */
export async function requireUserId(req?: Request): Promise<string | null> {
  // 1 — JWT Bearer token
  if (req) {
    const raw = extractBearerToken(req);
    if (raw) {
      const payload = await verifyToken(raw);
      if (payload?.kind === "user") return payload.sub;
    }
  }

  // 2 — NextAuth session
  const session = await auth();
  const u = session?.user as { id?: string; kind?: "user" | "admin" } | undefined;
  if (u?.kind !== "user") return null;
  return u.id ?? null;
}

/**
 * Resolves the current admin from either JWT Bearer token or NextAuth session.
 */
export async function requireAdmin(
  req?: Request,
): Promise<{ id: string; role: "admin" | "superadmin" } | null> {
  // 1 — JWT Bearer token
  if (req) {
    const raw = extractBearerToken(req);
    if (raw) {
      const payload = await verifyToken(raw);
      if (payload?.kind === "admin") {
        return { id: payload.sub, role: payload.role ?? "admin" };
      }
    }
  }

  // 2 — NextAuth session
  const session = await auth();
  const u = session?.user as
    | { id?: string; kind?: "user" | "admin"; role?: "admin" | "superadmin" }
    | undefined;
  if (!u?.id || u.kind !== "admin") return null;
  return { id: u.id, role: u.role ?? "admin" };
}
