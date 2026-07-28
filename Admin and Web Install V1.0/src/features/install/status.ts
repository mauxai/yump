import { prisma } from "@/lib/prisma";
import { INSTALL_VERSION, STEP } from "./config";

export interface InstallState {
  installed: boolean;
  /** Last completed wizard step (0 = nothing done yet). */
  step: number;
  /** False when the DB is unreachable or the schema isn't pushed yet. */
  dbReady: boolean;
}

/**
 * Read installer state from the dedicated `installations` table (single
 * row, created by the wizard's database step).
 *
 * Fail-closed by design: an unreachable database, a missing table and a
 * missing row all report "not installed" — the middleware gate then routes
 * everything to /install. The wizard's database step is what repairs each
 * of those situations.
 */
export async function getInstallState(): Promise<InstallState> {
  // No DATABASE_URL yet (fresh copy, wizard hasn't run) — definitively not
  // installed. Skipping the query keeps Prisma from logging a validation
  // error on every gated request of a freshly unpacked copy.
  if (!process.env.DATABASE_URL) {
    return { installed: false, step: STEP.fresh, dbReady: false };
  }
  try {
    const row = await prisma.installation.findFirst({
      select: { installed: true, step: true },
    });
    return {
      installed: row?.installed ?? false,
      step: row?.step ?? STEP.fresh,
      dbReady: true,
    };
  } catch {
    return { installed: false, step: STEP.fresh, dbReady: false };
  }
}

type InstallationPatch = Partial<{
  step: number;
  installed: boolean;
  version: string;
  buyerUsername: string;
  buyerName: string | null;
  buyerEmail: string | null;
  purchaseCode: string;
  domain: string;
  licenseActive: boolean;
  licenseCheckedAt: Date;
  licenseErrors: string | null;
  installedAt: Date;
}>;

/** Merge-write the single installation row, creating it on first use. */
export async function writeInstallState(patch: InstallationPatch): Promise<void> {
  const existing = await prisma.installation.findFirst({ select: { id: true } });
  if (existing) {
    await prisma.installation.update({ where: { id: existing.id }, data: patch });
  } else {
    await prisma.installation.create({ data: patch });
  }
}

/** Record a completed step, never moving backwards. */
export async function markStepCompleted(step: number): Promise<void> {
  const current = await getInstallState();
  await writeInstallState({ step: Math.max(step, current.step) });
}

/** Final step: flip the installed flag. One-way — there is no uninstall. */
export async function finalizeInstallation(): Promise<void> {
  await writeInstallState({
    installed: true,
    version: INSTALL_VERSION,
    installedAt: new Date(),
  });
}
