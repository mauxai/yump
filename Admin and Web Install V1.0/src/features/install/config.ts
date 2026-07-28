/**
 * Installation & activation configuration.
 *
 * Single source of truth for the web installer — bumping the product
 * version or changing a requirement should be a one-line change in this
 * file.
 *
 * All installation state is stored in the dedicated `installations` table
 * (prisma/schema/installation.prisma) — a built Next.js app cannot rely on
 * rewriting env vars at runtime. The two exceptions are DATABASE_URL (which
 * by definition cannot live inside the database it points to; see
 * env-writer.ts) and AUTH_SECRET (generated at boot by next.config.mjs).
 */

export const INSTALL_VERSION = "1.0.0";

/**
 * Product id on the 6amtech activation server, base64-encoded (decodes to 10000200).
 */
export const SOFTWARE_ID = "MTAwMDAyMDA=";

/** Wizard step numbers (a step is recorded once COMPLETED). */
export const STEP = {
  fresh: 0,
  database: 2,
  purchase: 3,
} as const;

/** Minimum Node.js major version surfaced on the requirements step. */
export const MIN_NODE_MAJOR = 18;
