import { SOFTWARE_ID } from "./config";

/**
 * Purchase-code / license activation against the 6amtech activation server.
 *
 * Ported from the Laravel V2 activation trait (single `register-domain`
 * endpoint used for both the install-time check and the post-install
 * runtime re-verification). The endpoint is base64-obfuscated; localhost and
 * demo installs skip the remote check.
 *
 * Fail-open by design: a network blip or timeout never reports "inactive" —
 * only a definitive `active = 0` from the server does. The verified buyer
 * details / purchase code and the cached activation result are persisted to
 * the installations table (see status.ts / activation.ts).
 */

const b64 = (s: string) => Buffer.from(s, "base64").toString("utf8");

// https://check.6amtech.com/api/v2/register-domain
const REGISTER_DOMAIN_URL = b64("aHR0cHM6Ly9jaGVjay42YW10ZWNoLmNvbS9hcGkvdjIvcmVnaXN0ZXItZG9tYWlu");

const SOFTWARE_TYPE = "product";
/** Connect + total request timeout, mirroring the Laravel trait (3s/5s). */
const REQUEST_TIMEOUT_MS = 5000;

export interface ActivationResult {
  active: boolean;
  errors: string[];
}

/** Development machines skip the remote check. */
export function isLocalHost(host: string): boolean {
  const bare = host.replace(/:\d+$/, "").toLowerCase();
  return ["127.0.0.1", "::1", "localhost"].includes(bare);
}

/** Localhost or demo deployments never gate on a license. */
export function activationBypassed(host: string): boolean {
  return isLocalHost(host) || process.env.NEXT_PUBLIC_IS_DEMO_MODE === "true";
}

function stripScheme(domain: string): string {
  return domain.replace(/^(https?:\/\/)?(www\.)?/i, "").replace(/\/.*$/, "");
}

/**
 * Replicates PHP's `(bool) base64_decode($value)`: the empty string and the
 * literal "0" are falsy, everything else is truthy. (Plain JS truthiness gets
 * this wrong — `Boolean("0") === true` — which would treat an inactive
 * response as active.)
 */
function phpTruthy(decoded: string): boolean {
  return decoded !== "" && decoded !== "0";
}

/**
 * Verify a purchase code for this domain.
 *
 * Used both at install time and for the post-install runtime re-check
 * (the Laravel trait shares one request builder for both).
 */
export async function verifyLicense(opts: {
  username: string;
  purchaseKey: string;
  /** Host header of the request — used only to decide localhost/demo bypass. */
  host: string;
  /** Domain to register/verify. Defaults to the request host when omitted. */
  domain?: string;
  name?: string;
  email?: string;
}): Promise<ActivationResult> {
  if (activationBypassed(opts.host)) {
    return { active: true, errors: [] };
  }

  // The register-domain payload the activation server expects:
  // username, purchase_key, software_id, domain, software_type, name, email.
  const form = new FormData();
  form.append("username", opts.username.trim());
  form.append("purchase_key", opts.purchaseKey);
  form.append("software_id", b64(SOFTWARE_ID));
  form.append("domain", stripScheme(opts.domain || opts.host));
  form.append("software_type", SOFTWARE_TYPE);
  form.append("name", opts.name ?? "");
  form.append("email", opts.email ?? "");

  try {
    const res = await fetch(REGISTER_DOMAIN_URL, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const json = (await res.json().catch(() => ({}))) as {
      active?: string;
      errors?: string[];
    };

    // Missing `active` key → treat as active (matches `?? base64_encode(1)`).
    const active = json.active === undefined ? true : phpTruthy(b64(json.active));
    return {
      active,
      errors: !active && Array.isArray(json.errors) ? json.errors : [],
    };
  } catch {
    // Fail-open: a network failure / timeout must never lock out a paying
    // customer (mirrors the Laravel V2 trait's catch block).
    return { active: true, errors: [] };
  }
}
