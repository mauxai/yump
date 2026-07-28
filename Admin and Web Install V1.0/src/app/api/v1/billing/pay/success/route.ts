import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPaymentGateway } from "@/lib/payment/registry";
import { grantCreditsForPayment, recordFailedPayment } from "@/lib/payment/grant-credits";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/billing/pay/success?session_id=...&gw=...
 *
 * First hit (no `data` param): verifies payment, then redirects to the same
 * URL with `&data=<base64_json>` appended so a mobile WebView can intercept
 * the final URL and decode the result.
 *
 * Second hit (has `data` param): decodes and returns the JSON directly —
 * useful for browser clients or WebViews that read the response body.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const session_id = searchParams.get("session_id");
  const gw         = searchParams.get("gw");
  const dataParam  = searchParams.get("data");

  // ── Second hit: data is already in the URL — WebView intercepts here, do nothing ──
  if (dataParam) {
    return new Response(null, { status: 200 });
  }

  // ── First hit: process payment then redirect with data in URL ──
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  function redirectWithData(corePayload: Record<string, unknown>) {
    const base64 = Buffer.from(JSON.stringify(corePayload)).toString("base64");
    const redirectUrl = `${origin}/api/v1/billing/pay/success?session_id=${session_id}&gw=${gw}&data=${encodeURIComponent(base64)}`;
    return NextResponse.redirect(redirectUrl, { status: 302 });
  }

  if (!session_id || !gw) {
    return redirectWithData({ payment_status: "failed", credit_added: 0, error: "Invalid payment link." });
  }

  const billingSession = await prisma.billingSession.findUnique({ where: { sessionId: session_id } });
  if (!billingSession) {
    return redirectWithData({ payment_status: "failed", credit_added: 0, error: "Session not found." });
  }

  const plan = await prisma.plan.findUnique({
    where: { id: billingSession.planId },
    select: { name: true },
  });

  const basePayload = {
    payment_status: "failed" as string,
    session_id:     billingSession.sessionId,
    gateway:        billingSession.gatewaySlug,
    plan_id:        billingSession.planId,
    plan_name:      plan?.name ?? null,
    amount:         Number(billingSession.amount),
    currency:       billingSession.currency,
    credit_added:   billingSession.credits,
  };

  // Already processed — return cached result
  if (billingSession.status === "paid") {
    return redirectWithData({ ...basePayload, payment_status: "success" });
  }
  if (billingSession.status === "failed") {
    return redirectWithData({ ...basePayload, credit_added: 0 });
  }

  const dbGateway = await prisma.gateway.findFirst({ where: { name: gw, type: "payment" } });
  if (!dbGateway) {
    return redirectWithData({ ...basePayload, credit_added: 0, error: "Gateway not configured." });
  }

  const impl = getPaymentGateway(gw);
  if (!impl) {
    return redirectWithData({ ...basePayload, credit_added: 0, error: `Gateway "${gw}" not integrated.` });
  }

  const credentials = (dbGateway.credentials ?? {}) as Record<string, string>;

  let result;
  try {
    result = await impl.verifySession(credentials, session_id);
  } catch {
    return redirectWithData({ ...basePayload, credit_added: 0, error: "Could not verify payment." });
  }

  if (!result) {
    return redirectWithData({ ...basePayload, credit_added: 0, error: "No result from gateway." });
  }

  await prisma.billingSession.update({ where: { sessionId: session_id }, data: { status: result.status } });

  if (result.status === "paid") {
    await grantCreditsForPayment(result, gw);
    return redirectWithData({ ...basePayload, payment_status: "success", credit_added: result.credits });
  }

  await recordFailedPayment(result, gw);
  return redirectWithData({ ...basePayload, credit_added: 0 });
}
