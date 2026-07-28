import { PrismaClient } from "@prisma/client";

// Single shared client, created lazily so DATABASE_URL is read at first
// use rather than at import time. Stored on globalThis to survive dev hot
// reloads. The indirection (Proxy + reset) exists for the install wizard:
// it rewrites DATABASE_URL at runtime and calls resetPrismaClient() so the
// running process switches databases without a restart.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  return new PrismaClient({
    // Pre-install (no DATABASE_URL yet) every query fails by design and all
    // callers have fallbacks — logging each failure would flood the console
    // of a freshly unpacked copy. The wizard resets the client after writing
    // the URL, so the replacement client logs normally.
    log: !process.env.DATABASE_URL
      ? []
      : process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });
}

/** Drop the shared client; the next query reconnects with current env. */
export function resetPrismaClient(): void {
  const old = globalForPrisma.prisma;
  globalForPrisma.prisma = undefined;
  old?.$disconnect().catch(() => {});
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = (globalForPrisma.prisma ??= createClient());
    const value = client[prop as keyof PrismaClient];
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(client)
      : value;
  },
});
