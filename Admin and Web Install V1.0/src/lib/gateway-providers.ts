/**
 * Gateway seeders
 * ─────────────────────────────────────────────────────────────
 * Run all gateways (Stripe + Twilio):
 *   npm run seed:gateways
 *
 * Run individually:
 *   npm run seed:stripe
 *   npm run seed:twilio
 *
 * Adding a new gateway in the future:
 *  1. Create  prisma/seeds/gateway-<name>.seed.ts
 *     - export async function seed<Name>Gateway(prisma: PrismaClient)
 *     - credentials: { key: "", ... }
 *     - config: { gateway_title, gateway_image, storage, ...extra }
 *  2. Import and call it in  prisma/seeds/gateways.ts
 *  3. Add an npm script in package.json:
 *       "seed:<name>": "dotenv -e .env.development -- tsx prisma/seeds/gateway-<name>.seed.ts"
 * ─────────────────────────────────────────────────────────────
 */

export const GATEWAY_TYPES = [
  { value: "payment", label: "Payment" },
  // { value: "sms",     label: "SMS" },
] as const;

export type GatewayType = typeof GATEWAY_TYPES[number]["value"];

export function typeBadgeCls(type: string): string {
  const map: Record<string, string> = {
    payment: "bg-[#10a37f]/10 text-[#10a37f] border-[#10a37f]/20",
    sms:     "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20",
  };
  return map[type] ?? "bg-bg-3 text-fg-2 border-line-2";
}

/** Keys that should render as password inputs in the form */
export const SENSITIVE_KEYS = [
  "secret_key", "api_key", "auth_token", "client_secret",
  "webhook_secret", "store_pass", "key_secret", "password", "api_secret",
];

export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEYS.some((s) => key.toLowerCase().includes(s));
}
