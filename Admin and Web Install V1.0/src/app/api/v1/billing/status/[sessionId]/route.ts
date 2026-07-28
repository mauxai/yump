import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-helpers";
import { unauthorized } from "@/lib/utils/error-handler";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/billing/status/:sessionId
 * Poll payment status after the WebView completes.
 * Returns: { status: "pending"|"paid"|"failed", credits?, amount?, currency? }
 */
export async function GET(
  req: Request,
  { params }: { params: { sessionId: string } }
) {
  const userId = await requireUserId(req);
  if (!userId) return unauthorized();

  const session = await prisma.billingSession.findFirst({
    where: { sessionId: params.sessionId, userId },
    select: { status: true, credits: true, amount: true, currency: true, updatedAt: true },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  return NextResponse.json({
    status:    session.status,
    credits:   session.credits,
    amount:    Number(session.amount),
    currency:  session.currency,
    updatedAt: session.updatedAt.toISOString(),
  });
}
