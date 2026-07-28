import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPaymentGateway } from "@/lib/payment/registry";
import { grantCreditsForPayment, recordFailedPayment } from "@/lib/payment/grant-credits";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/billing/webhook/:gateway
 * Receives payment gateway webhooks. Each gateway implementation handles
 * signature verification and event parsing. Adding a new gateway only
 * requires registering it in src/lib/payment/registry.ts.
 */
export async function POST(
  req: Request,
  { params }: { params: { gateway: string } }
) {
  const slug = params.gateway.toLowerCase();

  const impl = getPaymentGateway(slug);
  if (!impl) {
    return NextResponse.json({ error: `Unknown gateway: ${slug}` }, { status: 400 });
  }

  // Load gateway credentials
  const dbGateway = await prisma.gateway.findFirst({
    where: { name: slug, type: "payment", isActive: true },
  });
  if (!dbGateway) {
    return NextResponse.json({ error: "Gateway not configured." }, { status: 503 });
  }

  const rawBody = await req.text();
  const headers = Object.fromEntries(req.headers.entries());
  const credentials = (dbGateway.credentials ?? {}) as Record<string, string>;

  let result;
  try {
    result = await impl.handleWebhook(credentials, rawBody, headers);
  } catch (e) {
    console.error(`[webhook/${slug}] verification failed:`, e);
    return NextResponse.json({ error: "Webhook verification failed." }, { status: 400 });
  }

  if (!result) {
    // Non-payment event — acknowledge and ignore
    return NextResponse.json({ received: true });
  }

  // Update billing session status
  await prisma.billingSession.updateMany({
    where: { sessionId: result.gatewayRef },
    data:  { status: result.status },
  });

  if (result.status === "paid") {
    await grantCreditsForPayment(result, slug);
  } else if (result.status === "failed") {
    await recordFailedPayment(result, slug);
  }

  return NextResponse.json({ received: true });
}
