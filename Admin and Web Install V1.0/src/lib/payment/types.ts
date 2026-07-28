export interface CheckoutParams {
  planId: string;
  planName: string;
  /** Amount in the currency's smallest unit (e.g. cents for USD) */
  amountCents: number;
  currency: string;
  credits: number;
  userId: string;
  userEmail: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutResult {
  url: string;
  sessionId: string;
}

export interface PaymentResult {
  userId: string;
  planId: string;
  credits: number;
  /** Amount in decimal (e.g. 49.99) */
  amount: number;
  currency: string;
  /** Unique gateway reference — used as idempotency key */
  gatewayRef: string;
  status: "paid" | "failed" | "pending";
}

/**
 * Implement this interface to add a new payment gateway.
 * Register the implementation in registry.ts.
 */
export interface PaymentGateway {
  slug: string;

  createCheckout(
    credentials: Record<string, string>,
    config: Record<string, string>,
    params: CheckoutParams
  ): Promise<CheckoutResult>;

  /**
   * Verify a session by its ID (called on the success redirect).
   * Returns the payment result regardless of status.
   */
  verifySession(
    credentials: Record<string, string>,
    sessionId: string
  ): Promise<PaymentResult | null>;

  /**
   * Parse an incoming webhook event.
   * Return null to ignore non-payment events.
   * Throw on invalid signature.
   */
  handleWebhook(
    credentials: Record<string, string>,
    rawBody: string,
    headers: Record<string, string>
  ): Promise<PaymentResult | null>;

  /** Keys safe to expose to the browser (never secrets). */
  publicConfig(
    credentials: Record<string, string>,
    config: Record<string, string>
  ): Record<string, string>;
}
