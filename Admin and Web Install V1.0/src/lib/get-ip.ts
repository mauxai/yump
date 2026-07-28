import { headers } from "next/headers";

/** Extract the client IP from request headers. */
export function getClientIp(): string {
  const hdrs = headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    hdrs.get("x-real-ip") ||
    hdrs.get("cf-connecting-ip") ||
    hdrs.get("x-client-ip") ||
    null;

  if (!ip) {
    const host = hdrs.get("host") ?? "";
    return host.startsWith("localhost") || host.startsWith("127.") ? "localhost" : "unknown";
  }

  return ip === "::1" ? "localhost" : ip;
}
