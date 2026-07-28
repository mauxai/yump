import Stripe from "stripe";
import type { PaymentGateway, CheckoutParams, CheckoutResult, PaymentResult } from "../types";

function client(secretKey: string) {
  return new Stripe(secretKey, { apiVersion: "2026-04-22.dahlia" });
}

function sessionToResult(session: Stripe.Checkout.Session): PaymentResult | null {
  const { userId, planId, credits } = session.metadata ?? {};
  if (!userId || !planId || !credits) return null;

  const status =
    session.payment_status === "paid" ? "paid" :
    session.status === "expired"      ? "failed" : "pending";

  return {
    userId,
    planId,
    credits:    parseInt(credits, 10),
    amount:     (session.amount_total ?? 0) / 100,
    currency:   (session.currency ?? "usd").toUpperCase(),
    gatewayRef: (session.payment_intent as string) ?? session.id,
    status,
  };
}

export const stripeGateway: PaymentGateway = {
  slug: "stripe",

  async createCheckout(credentials, config, params: CheckoutParams): Promise<CheckoutResult> {
    const stripe = client(credentials.secret_key);
    const currency = (config.currency || params.currency || "usd").toLowerCase();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: params.userEmail,
      line_items: [
        {
          price_data: {
            currency,
            unit_amount: params.amountCents,
            product_data: {
              name: params.planName,
              description: `${params.credits.toLocaleString()} credits / month`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId:  params.userId,
        planId:  params.planId,
        credits: String(params.credits),
      },
      success_url: params.successUrl,
      cancel_url:  params.cancelUrl,
    });

    if (!session.url) throw new Error("Stripe did not return a checkout URL.");
    return { url: session.url, sessionId: session.id };
  },

  async verifySession(credentials, sessionId): Promise<PaymentResult | null> {
    const stripe = client(credentials.secret_key);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return sessionToResult(session);
  },

  async handleWebhook(credentials, rawBody, headers): Promise<PaymentResult | null> {
    const stripe = client(credentials.secret_key);
    const sig    = headers["stripe-signature"];
    const secret = credentials.webhook_secret;

    let event: Stripe.Event;
    if (secret) {
      try {
        event = stripe.webhooks.constructEvent(rawBody, sig, secret);
      } catch {
        throw new Error("Stripe webhook signature verification failed.");
      }
    } else {
      // No webhook secret configured — parse without verification (dev only)
      event = JSON.parse(rawBody) as Stripe.Event;
    }

    if (event.type !== "checkout.session.completed") return null;
    return sessionToResult(event.data.object as Stripe.Checkout.Session);
  },

  publicConfig(credentials, config) {
    return {
      publishable_key: credentials.publishable_key ?? "",
      currency:        config.currency ?? "usd",
    };
  },
};
