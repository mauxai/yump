import crypto from "crypto";
import type {
  PaymentGateway,
  CheckoutParams,
  CheckoutResult,
  PaymentResult,
} from "../types";

// ---------------------------------------------------------------------------
// Razorpay REST helpers (no SDK dependency — keeps the bundle lean)
// ---------------------------------------------------------------------------

const RAZORPAY_BASE = "https://api.razorpay.com/v1";

type RazorpayCredentials = {
  key_id: string;
  key_secret: string;
  webhook_secret?: string;
};

type RazorpayPaymentLink = {
  id: string;
  short_url: string;
  status: string;
  amount: number;
  currency: string;
  amount_paid?: number;
  notes?: Record<string, string>;
  payments?: {
    count: number;
    items: Array<{ id: string; status: string }>;
  };
};

async function razorpayFetch<T>(
  credentials: RazorpayCredentials,
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const auth = Buffer.from(`${credentials.key_id}:${credentials.key_secret}`).toString("base64");
  const res = await fetch(`${RAZORPAY_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Razorpay API error (${res.status}): ${text}`);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Gateway implementation
// ---------------------------------------------------------------------------

export const razorpayGateway: PaymentGateway = {
  slug: "razorpay",

  // ── 1. Create a hosted Payment Link ──────────────────────────────────────
  async createCheckout(
    credentials: Record<string, string>,
    config: Record<string, string>,
    params: CheckoutParams
  ): Promise<CheckoutResult> {
    const creds = credentials as unknown as RazorpayCredentials;
    const currency = (config.currency || params.currency || "INR").toUpperCase();

    const link = await razorpayFetch<RazorpayPaymentLink>(creds, "/payment_links", {
      method: "POST",
      body: JSON.stringify({
        amount: params.amountCents,        // smallest unit (e.g. paise for INR)
        currency,
        accept_partial: false,
        description: `${params.planName} — ${params.credits.toLocaleString()} credits`,
        customer: { email: params.userEmail },
        notify: { email: true },
        notes: {
          userId:  params.userId,
          planId:  params.planId,
          credits: String(params.credits),
        },
        // Razorpay will GET this URL on completion
        callback_url:    params.successUrl.replace("{CHECKOUT_SESSION_ID}", ""),
        callback_method: "get",
      }),
    });

    if (!link.short_url) throw new Error("Razorpay did not return a payment link URL.");

    // Replace the Stripe-style placeholder with the actual link id
    const sessionId = link.id;
    return {
      url:       link.short_url,
      sessionId,
    };
  },

  // ── 2. Verify a Payment Link after the user returns ──────────────────────
  async verifySession(
    credentials: Record<string, string>,
    sessionId: string
  ): Promise<PaymentResult | null> {
    const creds = credentials as unknown as RazorpayCredentials;

    const link = await razorpayFetch<RazorpayPaymentLink>(
      creds,
      `/payment_links/${sessionId}`
    );

    const notes  = (link.notes ?? {}) as Record<string, string>;
    const userId  = notes.userId;
    const planId  = notes.planId;
    const credits = parseInt(notes.credits ?? "0", 10);

    if (!userId || !planId) return null;

    const status: PaymentResult["status"] =
      link.status === "paid"      ? "paid"    :
      link.status === "cancelled" ? "failed"  : "pending";

    return {
      userId,
      planId,
      credits,
      amount:     Number(link.amount) / 100,
      currency:   link.currency,
      gatewayRef: link.id,
      status,
    };
  },

  // ── 3. Handle incoming Razorpay webhooks ─────────────────────────────────
  async handleWebhook(
    credentials: Record<string, string>,
    rawBody: string,
    headers: Record<string, string>
  ): Promise<PaymentResult | null> {
    const creds     = credentials as unknown as RazorpayCredentials;
    const signature = headers["x-razorpay-signature"];
    const secret    = creds.webhook_secret;

    // Verify HMAC-SHA256 signature when a webhook secret is configured
    if (secret) {
      if (!signature) throw new Error("Razorpay webhook: missing x-razorpay-signature header.");
      const expected = crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex");
      if (expected !== signature) {
        throw new Error("Razorpay webhook: signature mismatch.");
      }
    }

    const payload = JSON.parse(rawBody) as {
      event: string;
      payload: {
        payment_link?: { entity: RazorpayPaymentLink };
        payment?:      { entity: { id: string; status: string } };
      };
    };

    // Only handle paid payment-link events
    if (payload.event !== "payment_link.paid") return null;

    const entity  = payload.payload.payment_link?.entity;
    if (!entity) return null;

    const notes   = (entity.notes ?? {}) as Record<string, string>;
    const userId  = notes.userId;
    const planId  = notes.planId;
    const credits = parseInt(notes.credits ?? "0", 10);

    if (!userId || !planId) return null;

    // Use the underlying payment id as the idempotency key if available
    const gatewayRef =
      payload.payload.payment?.entity?.id ?? entity.id;

    return {
      userId,
      planId,
      credits,
      amount:     Number(entity.amount) / 100,
      currency:   entity.currency,
      gatewayRef,
      status:     "paid",
    };
  },

  // ── 4. Safe public config (never expose key_secret) ──────────────────────
  publicConfig(
    credentials: Record<string, string>,
    config: Record<string, string>
  ): Record<string, string> {
    return {
      key_id:   credentials.key_id ?? "",
      currency: config.currency ?? "INR",
    };
  },
};
