import { prisma } from "@/lib/prisma";
import { activationBypassed, verifyLicense } from "./license";
import { writeInstallState } from "./status";

/**
 * Post-install runtime license re-verification (Node runtime only — uses
 * Prisma). Ported from the Laravel V2 `checkActivationCache`: the stored
 * purchase code is re-checked against the activation server on a 24h TTL and
 * the result is cached in the installations row.
 *
 * Fail-open everywhere: bypassed hosts, a not-yet-installed app, missing
 * credentials, a stale-but-unreachable server, or any thrown error all report
 * "active". Only a fresh, definitive `active = 0` gates the app.
 */

/** Re-verify at most once per 24h. */
const CACHE_TTL_MS = 1000 * 60 * 60 * 24;

export async function getActivationStatus(host: string): Promise<boolean> {
  if (activationBypassed(host)) return true;

  try {
    const row = await prisma.installation.findFirst({
      select: {
        installed: true,
        buyerUsername: true,
        buyerName: true,
        buyerEmail: true,
        purchaseCode: true,
        domain: true,
        licenseActive: true,
        licenseCheckedAt: true,
      },
    });

    // Pre-install the install gate owns routing; no credentials → fail-open
    // (state reset / wiped), never lock the panel out.
    if (!row || !row.installed) return true;
    if (!row.purchaseCode) return true;

    const fresh =
      row.licenseCheckedAt !== null &&
      Date.now() - row.licenseCheckedAt.getTime() < CACHE_TTL_MS;
    if (fresh) return row.licenseActive;

    const result = await verifyLicense({
      username: row.buyerUsername ?? "",
      purchaseKey: row.purchaseCode,
      host,
      domain: row.domain ?? undefined,
      name: row.buyerName ?? undefined,
      email: row.buyerEmail ?? undefined,
    });

    // Persisting the refreshed state is best-effort; the verification result
    // governs this request regardless of whether the write succeeds.
    try {
      await writeInstallState({
        licenseActive: result.active,
        licenseCheckedAt: new Date(),
        licenseErrors: result.errors.length ? JSON.stringify(result.errors) : null,
      });
    } catch {
      /* best-effort — never block on a write failure */
    }

    return result.active;
  } catch {
    return true;
  }
}
