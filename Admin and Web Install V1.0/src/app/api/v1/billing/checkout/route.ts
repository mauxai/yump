import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-helpers";
import { getPaymentGateway } from "@/lib/payment/registry";

import { getSystemCurrency } from "@/lib/currency";

export const dynamic = "force-dynamic";

const schema = z.object({
  planId:     z.string().min(1),
  gatewayId:  z.string().optional(),
  /**
   * "panel" — browser/web flow: gateway redirects back to the billing page
   *           which shows a native success/error state via toast.
   * "api"   — mobile/WebView flow: gateway redirects to a JSON endpoint;
   *           app reads the response and polls /billing/status/:sessionId.
   * Defaults to "api".
   */
  returnMode: z.enum(["panel", "api"]).default("api"),
});

export async function POST(req: Request) {
  try {
    const userId = await requireUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body   = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }

    const { planId, gatewayId, returnMode } = parsed.data;

    const [plan, user] = await Promise.all([
      prisma.plan.findUnique({ where: { id: planId } }),
      prisma.user.findUnique({ where: { id: userId }, select: { email: true } }),
    ]);
    if (!plan) return NextResponse.json({ error: "Plan not found." }, { status: 404 });
    if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

    const dbGateway = await prisma.gateway.findFirst({
      where: { type: "payment", isActive: true, ...(gatewayId ? { id: gatewayId } : {}) },
    });
    if (!dbGateway) {
      return NextResponse.json({ error: "No active payment gateway configured." }, { status: 503 });
    }

    const impl = getPaymentGateway(dbGateway.name);
    if (!impl) {
      return NextResponse.json(
        { error: `Payment gateway "${dbGateway.name}" is not yet integrated.` },
        { status: 501 }
      );
    }

    const credentials    = (dbGateway.credentials ?? {}) as Record<string, string>;
    const config         = (dbGateway.config ?? {})      as Record<string, string>;
    const systemCurrency = await getSystemCurrency();
    const currency       = (config.currency || systemCurrency.code).toLowerCase();
    const amountCents    = Math.round(Number(plan.price) * 100);

    const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    // ── Panel flow: redirect back to the billing page; page shows toast ──
    // ── API flow:  redirect to JSON endpoint; app reads the response     ──
    const successUrl = returnMode === "panel"
      ? `${origin}/billing?success=1&session_id={CHECKOUT_SESSION_ID}&gw=${dbGateway.name}`
      : `${origin}/api/v1/billing/pay/success?session_id={CHECKOUT_SESSION_ID}&gw=${dbGateway.name}`;

    const cancelUrl = returnMode === "panel"
      ? `${origin}/billing?cancelled=1`
      : `${origin}/api/v1/billing/pay/cancel`;

    const result = await impl.createCheckout(credentials, config, {
      planId:    plan.id,
      planName:  plan.name,
      amountCents,
      currency,
      credits:   plan.credits,
      userId,
      userEmail: user.email,
      successUrl,
      cancelUrl,
    });

    // Persist session for status polling and webhook reconciliation
    await prisma.billingSession.create({
      data: {
        sessionId:   result.sessionId,
        userId,
        planId:      plan.id,
        gatewaySlug: dbGateway.name,
        gatewayId:   dbGateway.id,
        status:      "pending",
        credits:     plan.credits,
        amount:      Number(plan.price),
        currency:    currency.toUpperCase(),
      },
    });

    return NextResponse.json({ url: result.url, sessionId: result.sessionId });
  } catch (e) {
    console.error("[billing/checkout]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Checkout failed." },
      { status: 500 }
    );
  }
}
