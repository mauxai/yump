import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-helpers";
import { unauthorized, handleApiError } from "@/lib/utils/error-handler";

export const dynamic = "force-dynamic";

/**
 * @openapi
 * /api/user/analytics:
 *   get:
 *     summary: Get user analytics and usage stats
 *     tags: [User]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Analytics data
 */
export async function GET(req: Request) {
  try {
    const userId = await requireUserId(req);
    if (!userId) return unauthorized();

    const [user, totalProjects, totalEdits, recentEdits, recentBilling, modelUsageRaw] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { creditsUsed: true, creditsTotal: true },
      }),
      prisma.project.count({ where: { userId } }),
      prisma.edit.count({ where: { project: { userId } } }),
      prisma.edit.findMany({
        where: { project: { userId } },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id:        true,
          prompt:    true,
          createdAt: true,
          project:   { select: { id: true, name: true } },
        },
      }),
      prisma.billingHistory.findMany({
        where: { userId, status: "paid" },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id:             true,
          description:    true,
          creditsGranted: true,
          createdAt:      true,
        },
      }),
      prisma.$queryRawUnsafe<Array<{ model_id: string | null; label: string; edits: bigint; credits: bigint }>>(
        `SELECT e.ai_model_id as model_id, COALESCE(m.label,'Unknown') as label, COUNT(*) as edits, SUM(e.credit_cost) as credits
         FROM edits e
         LEFT JOIN ai_models m ON m.id = e.ai_model_id
         INNER JOIN projects p ON p.id = e.project_id AND p.user_id = ?
         GROUP BY e.ai_model_id, m.label ORDER BY edits DESC LIMIT 5`,
        userId,
      ),
    ]);

    if (!user) return unauthorized();

    const recentActivity = [
      ...recentEdits.map((e) => ({
        id:          e.id,
        type:        "edit_made" as const,
        description: `Edited "${e.project.name}": ${e.prompt}`,
        createdAt:   e.createdAt.toISOString(),
        meta:        { projectId: e.project.id },
      })),
      ...recentBilling.map((b) => ({
        id:          b.id,
        type:        "credit_purchased" as const,
        description: b.description,
        createdAt:   b.createdAt.toISOString(),
        meta:        { creditsGranted: b.creditsGranted },
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    const modelUsage = modelUsageRaw.map((r) => ({
      modelId: r.model_id,
      label:   r.label,
      edits:   Number(r.edits),
      credits: Number(r.credits),
    }));

    return NextResponse.json({
      analytics: {
        totalProjects,
        totalEdits,
        creditsUsed:      user.creditsUsed,
        creditsTotal:     user.creditsTotal,
        creditsRemaining: Math.max(0, user.creditsTotal - user.creditsUsed),
        recentActivity,
        modelUsage,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
