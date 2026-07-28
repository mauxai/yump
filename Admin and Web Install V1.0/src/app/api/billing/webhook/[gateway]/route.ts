import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPaymentGateway } from "@/lib/payment/registry";
import { grantCreditsForPayment, recordFailedPayment } from "@/lib/payment/grant-credits";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { gateway: string } }
) {
  const slug = params.gateway.toLowerCase();

  try {
    const impl = getPaymentGateway(slug);
    if (!impl) return NextResponse.json({ error: `Unknown gateway: ${slug}` }, { status: 404 });

    const dbGateway = await prisma.gateway.findFirst({ where: { name: slug, type: "payment" } });
    if (!dbGateway) return NextResponse.json({ error: "Gateway not configured." }, { status: 404 });

    const credentials = (dbGateway.credentials ?? {}) as Record<string, string>;
    const rawBody = await req.text();
    const headers: Record<string, string> = {};
    req.headers.forEach((v, k) => { headers[k] = v; });

    const result = await impl.handleWebhook(credentials, rawBody, headers);
    if (!result) return NextResponse.json({ received: true });

    if (result.status === "paid") {
      await grantCreditsForPayment(result, slug);
    } else if (result.status === "failed") {
      await recordFailedPayment(result, slug);
    }

    return NextResponse.json({ received: true });
  } catch (e) {
    console.error(`[billing/webhook/${slug}]`, e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Webhook error" }, { status: 400 });
  }
}
