import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** GET /api/v1/billing/plans — public list of active plans */
export async function GET() {
  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { price: "asc" },
    select: {
      id:          true,
      name:        true,
      credits:     true,
      price:       true,
      recommended: true,
    },
  });

  return NextResponse.json({
    plans: plans.map((p) => ({
      id:          p.id,
      name:        p.name,
      credits:     p.credits,
      price:       Number(p.price),
      recommended: p.recommended,
    })),
  });
}
