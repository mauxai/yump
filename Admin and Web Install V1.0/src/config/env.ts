/**
 * Central access point for environment variables. Import from here instead of
 * reading process.env directly so typos fail loudly.
 *
 * Validation is lazy (getters, not eager values): the app ships with
 * DATABASE_URL empty — the install wizard fills it in at runtime — so merely
 * importing this module must never throw. `next build` imports page modules
 * while collecting page data, and an eager `required()` would fail the build
 * of a not-yet-installed copy.
 */

function required(name: string): string {
  const v = process.env[name];
  if (!v || v.length === 0) throw new Error(`Missing env var: ${name}`);
  return v;
}

export const env = {
  get DATABASE_URL() {
    return required("DATABASE_URL");
  },
  get AUTH_SECRET() {
    return required("AUTH_SECRET");
  },
};

export const publicEnv = {
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME ?? "6Image",
  APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION ?? "1.0",
  IS_DEVELOPMENT_MODE: process.env.NEXT_PUBLIC_IS_DEVELOPMENT_MODE === "true",
};
