import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-helpers";
import { unauthorized, handleApiError } from "@/lib/utils/error-handler";

export const dynamic = "force-dynamic";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE     = 100;

export async function GET(req: Request) {
  try {
    const userId = await requireUserId(req);
    if (!userId) return unauthorized();

    const { searchParams } = new URL(req.url);
    const page     = Math.max(1, parseInt(searchParams.get("page")     ?? "1",  10));
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(searchParams.get("pageSize") ?? String(DEFAULT_PAGE_SIZE), 10)));
    const status   = searchParams.get("status"); // paid | pending | failed | refunded | null = all
    const q        = searchParams.get("q")?.trim() ?? "";
    const skip     = (page - 1) * pageSize;

    const where = {
      userId,
      ...(status ? { status } : {}),
      ...(q ? {
        OR: [
          { description: { contains: q } },
          { gatewayRef:  { contains: q } },
          { status:      { contains: q } },
        ],
      } : {}),
    };

    const [records, total] = await Promise.all([
      prisma.billingHistory.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: pageSize,
        skip,
      }),
      prisma.billingHistory.count({ where }),
    ]);

    // Fetch plan names for records that have a planId
    const planIds = [...new Set(records.map((r) => r.planId).filter(Boolean))] as string[];
    const plans = planIds.length
      ? await prisma.plan.findMany({
          where: { id: { in: planIds } },
          select: { id: true, name: true, credits: true },
        })
      : [];
    const planMap = Object.fromEntries(plans.map((p) => [p.id, p]));

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return NextResponse.json({
      history: records.map((r) => ({
        id:             r.id,
        amount:         Number(r.amount),
        currency:       r.currency,
        status:         r.status,
        description:    r.description,
        creditsGranted: r.creditsGranted,
        gatewayRef:     r.gatewayRef,
        createdAt:      r.createdAt,
        plan: r.planId && planMap[r.planId]
          ? { id: r.planId, name: planMap[r.planId].name, credits: planMap[r.planId].credits }
          : null,
      })),
      pagination: {
        total,
        page,
        pageSize,
        totalPages,
        ...(q ? { q } : {}),
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
