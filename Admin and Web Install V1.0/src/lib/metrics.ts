import { prisma } from "@/lib/prisma";

export type DailyPoint = { date: string; value: number };

export type MetricsPayload = {
  users: { total: number; new1d: number; new7d: number; new30d: number };
  activity: { active7d: number; active30d: number };
  edits: { total: number; today: number; d7: number; d30: number };
  credits: { totalUsedSnapshot: number; totalEditsAsCreditProxy: number };
  revenue: { total: number; d7: number; d30: number };
  top: Array<{ id: string; email: string; name: string | null; editCount: number }>;
  topModels: Array<{ id: string; label: string; provider: string; creditCost: number; isDefault: boolean; isActive: boolean }>;
  creditsD7: Array<{ date: string; credits: number }>;
  modelUsage: Array<{ modelId: string | null; label: string; edits: number; credits: number }>;
  modelDaily: Array<{ date: string; modelId: string | null; label: string; edits: number; credits: number }>;
  recentAudit: Array<{
    id: string;
    action: string;
    actorAdminId: string;
    targetType: string | null;
    targetId: string | null;
    createdAt: string;
  }>;
  series: {
    editsDaily: DailyPoint[];
    usersDaily: DailyPoint[];
    revenueDaily: DailyPoint[];
  };
};

function subDays(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

function buildDateMap(rows: Array<{ date: string; cnt: bigint | string | number }>, days: number): DailyPoint[] {
  const map = new Map(rows.map((r) => [r.date, Number(r.cnt)]));
  const result: DailyPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    result.push({ date: key, value: map.get(key) ?? 0 });
  }
  return result;
}

export async function collectMetrics(): Promise<MetricsPayload> {
  const start1d   = subDays(1);
  const start7d   = subDays(7);
  const start30d  = subDays(30);
  const startToday = new Date();
  startToday.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    new1d,
    new7d,
    new30d,
    active7d,
    active30d,
    totalEdits,
    editsToday,
    editsD7,
    editsD30,
    creditsSum,
    topRows,
    recentAudit,
    revenueTotal,
    revenueD7,
    revenueD30,
    editsSeriesRaw,
    usersSeriesRaw,
    revenueSeriesRaw,
    topModels,
    creditsD7Raw,
    modelUsageRaw,
    modelDailyRaw,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: start1d } } }),
    prisma.user.count({ where: { createdAt: { gte: start7d } } }),
    prisma.user.count({ where: { createdAt: { gte: start30d } } }),
    prisma.user.count({ where: { lastActiveAt: { gte: start7d } } }),
    prisma.user.count({ where: { lastActiveAt: { gte: start30d } } }),
    prisma.edit.count(),
    prisma.edit.count({ where: { createdAt: { gte: startToday } } }),
    prisma.edit.count({ where: { createdAt: { gte: start7d } } }),
    prisma.edit.count({ where: { createdAt: { gte: start30d } } }),
    prisma.user.aggregate({ _sum: { creditsUsed: true } }),
    prisma.user.findMany({
      select: {
        id: true, email: true, name: true,
        projects: { select: { _count: { select: { edits: true } } } },
      },
    }),
    prisma.adminAudit.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, action: true, actorAdminId: true, targetType: true, targetId: true, createdAt: true },
    }),
    prisma.billingHistory.aggregate({ _sum: { amount: true }, where: { status: "paid" } }),
    prisma.billingHistory.aggregate({ _sum: { amount: true }, where: { status: "paid", createdAt: { gte: start7d } } }),
    prisma.billingHistory.aggregate({ _sum: { amount: true }, where: { status: "paid", createdAt: { gte: start30d } } }),
    // daily series — raw SQL for GROUP BY DATE
    prisma.$queryRawUnsafe<Array<{ date: string; cnt: bigint }>>(
      `SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as date, COUNT(*) as cnt FROM edits WHERE created_at >= ? GROUP BY date`,
      start30d,
    ),
    prisma.$queryRawUnsafe<Array<{ date: string; cnt: bigint }>>(
      `SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as date, COUNT(*) as cnt FROM users WHERE created_at >= ? GROUP BY date`,
      start30d,
    ),
    prisma.$queryRawUnsafe<Array<{ date: string; cnt: string }>>(
      `SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as date, SUM(amount) as cnt FROM billing_history WHERE status = 'paid' AND created_at >= ? GROUP BY date`,
      start30d,
    ),
    prisma.aiModel.findMany({
      orderBy: [{ isDefault: "desc" }, { creditCost: "asc" }],
      select: { id: true, label: true, provider: true, creditCost: true, isDefault: true, isActive: true },
    }),
    prisma.$queryRawUnsafe<Array<{ date: string; cnt: bigint }>>(
      `SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as date, COUNT(*) as cnt FROM edits WHERE created_at >= ? GROUP BY date ORDER BY date DESC LIMIT 7`,
      start7d,
    ),
    // Total usage per model (all-time, exclude untracked edits)
    prisma.$queryRawUnsafe<Array<{ model_id: string | null; label: string; edits: bigint; credits: bigint }>>(
      `SELECT e.ai_model_id as model_id, COALESCE(m.label, 'Unknown') as label,
              COUNT(*) as edits, SUM(e.credit_cost) as credits
       FROM edits e LEFT JOIN ai_models m ON m.id = e.ai_model_id
       WHERE e.ai_model_id IS NOT NULL
       GROUP BY e.ai_model_id, m.label ORDER BY edits DESC LIMIT 10`,
    ),
    // Daily usage per model (last 30 days, exclude untracked edits)
    prisma.$queryRawUnsafe<Array<{ date: string; model_id: string | null; label: string; edits: bigint; credits: bigint }>>(
      `SELECT DATE_FORMAT(e.created_at, '%Y-%m-%d') as date, e.ai_model_id as model_id,
              COALESCE(m.label, 'Unknown') as label,
              COUNT(*) as edits, SUM(e.credit_cost) as credits
       FROM edits e LEFT JOIN ai_models m ON m.id = e.ai_model_id
       WHERE e.created_at >= ? AND e.ai_model_id IS NOT NULL
       GROUP BY date, e.ai_model_id, m.label ORDER BY date DESC`,
      start30d,
    ),
  ]);

  const top = topRows
    .map((u) => ({
      id: u.id, email: u.email, name: u.name,
      editCount: u.projects.reduce((a, p) => a + p._count.edits, 0),
    }))
    .sort((a, b) => b.editCount - a.editCount)
    .slice(0, 10);

  return {
    users:    { total: totalUsers, new1d, new7d, new30d },
    activity: { active7d, active30d },
    edits:    { total: totalEdits, today: editsToday, d7: editsD7, d30: editsD30 },
    credits:  { totalUsedSnapshot: creditsSum._sum.creditsUsed ?? 0, totalEditsAsCreditProxy: totalEdits },
    revenue:  {
      total: Number(revenueTotal._sum.amount ?? 0),
      d7:    Number(revenueD7._sum.amount ?? 0),
      d30:   Number(revenueD30._sum.amount ?? 0),
    },
    top,
    topModels,
    creditsD7: creditsD7Raw.map((r) => ({ date: r.date, credits: Number(r.cnt) })),
    modelUsage: modelUsageRaw.map((r) => ({
      modelId: r.model_id,
      label:   r.label,
      edits:   Number(r.edits),
      credits: Number(r.credits),
    })),
    modelDaily: modelDailyRaw.map((r) => ({
      date:    r.date,
      modelId: r.model_id,
      label:   r.label,
      edits:   Number(r.edits),
      credits: Number(r.credits),
    })),
    recentAudit: recentAudit.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
    series: {
      editsDaily:   buildDateMap(editsSeriesRaw,   30),
      usersDaily:   buildDateMap(usersSeriesRaw,   30),
      revenueDaily: buildDateMap(revenueSeriesRaw, 30),
    },
  };
}
