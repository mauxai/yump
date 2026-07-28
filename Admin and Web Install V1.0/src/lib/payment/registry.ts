import type { PaymentGateway } from "./types";
import { stripeGateway } from "./gateways/stripe";
import { razorpayGateway } from "./gateways/razorpay";

/**
 * To add a new payment gateway:
 *   1. Create src/lib/payment/gateways/<slug>.ts implementing PaymentGateway
 *   2. Import it here and add an entry below
 *   3. Seed a gateway row in the DB with the matching `name` field
 *   4. Add the webhook route to src/app/api/billing/webhook/[gateway]/route.ts (already dynamic)
 */
const REGISTRY: Record<string, PaymentGateway> = {
  stripe: stripeGateway,
  razorpay: razorpayGateway,
  // paypal: paypalGateway,
  // sslcommerz: sslcommerzGateway,
};

export function getPaymentGateway(slug: string): PaymentGateway | null {
  return REGISTRY[slug] ?? null;
}

export function listRegisteredGateways(): string[] {
  return Object.keys(REGISTRY);
}
