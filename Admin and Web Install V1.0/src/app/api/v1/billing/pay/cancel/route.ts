import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** GET /api/v1/billing/pay/cancel — gateway redirects here on cancellation */
export async function GET() {
  return NextResponse.json({ payment_status: "cancelled", credit_added: 0 });
}
