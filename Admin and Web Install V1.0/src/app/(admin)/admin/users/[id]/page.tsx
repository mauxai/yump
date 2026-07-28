import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { UserDetailContent } from "./UserDetailContent";

export const dynamic = "force-dynamic";

export default async function AdminUserDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const admin = await requireAdmin();
  if (!admin) redirect("/");

  const [user, projects, edits, modelUsageRaw, earningsRaw] = await Promise.all([
    prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true, email: true, name: true, avatar: true, status: true,
        creditsUsed: true, creditsTotal: true, lastActiveAt: true, createdAt: true,
      },
    }),
    prisma.project.findMany({
      where: { userId: params.id },
      select: { id: true, name: true, updatedAt: true, _count: { select: { edits: true } } },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    prisma.edit.findMany({
      where: { project: { userId: params.id } },
      select: { id: true, projectId: true, prompt: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.$queryRawUnsafe<Array<{ label: string; edits: bigint; credits: bigint }>>(
      `SELECT COALESCE(m.label,'Unknown') as label, COUNT(*) as edits, SUM(e.credit_cost) as credits
       FROM edits e
       LEFT JOIN ai_models m ON m.id = e.ai_model_id
       INNER JOIN projects p ON p.id = e.project_id AND p.user_id = ?
       WHERE e.ai_model_id IS NOT NULL
       GROUP BY e.ai_model_id, m.label ORDER BY edits DESC LIMIT 5`,
      params.id,
    ),
    prisma.$queryRawUnsafe<Array<{ total: string | null; count: bigint }>>(
      `SELECT SUM(amount) as total, COUNT(*) as count
       FROM billing_history WHERE user_id = ? AND status = 'paid'`,
      params.id,
    ),
  ]);

  if (!user) notFound();

  return (
    <UserDetailContent
        data={{
          user: {
            ...user,
            lastActiveAt: user.lastActiveAt?.toISOString() ?? null,
            createdAt: user.createdAt.toISOString(),
          },
          projects: projects.map((p) => ({
            ...p,
            updatedAt: p.updatedAt.toISOString(),
          })),
          edits: edits.map((e) => ({
            ...e,
            createdAt: e.createdAt.toISOString(),
          })),
          modelUsage: modelUsageRaw.map((r) => ({
            label: r.label,
            edits: Number(r.edits),
            credits: Number(r.credits),
          })),
          totalEarnings: Number(earningsRaw[0]?.total ?? 0),
          totalPurchases: Number(earningsRaw[0]?.count ?? 0),
        }}
      />
  );
}
