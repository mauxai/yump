import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { AuditContent } from "./AuditContent";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

function periodToDate(period: string): Date | null {
  const now = new Date();
  if (period === "today") return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === "7d")  return new Date(Date.now() - 7  * 864e5);
  if (period === "30d") return new Date(Date.now() - 30 * 864e5);
  return null;
}

function pageNumbers(cur: number, last: number): (number | "…")[] {
  const set = new Set([1, last, cur - 2, cur - 1, cur, cur + 1, cur + 2].filter(n => n >= 1 && n <= last));
  const sorted = [...set].sort((a, b) => a - b);
  const result: (number | "…")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push("…");
    result.push(sorted[i]);
  }
  return result;
}

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: { period?: string; actor?: string; page?: string };
}) {
  const admin = await requireAdmin();
  if (!admin) redirect("/");

  const period = searchParams.period ?? "";
  const actorFilter = (searchParams.actor ?? "").trim();
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10));
  const since = periodToDate(period);

  // Resolve actor filter to a set of admin IDs (DB-side filtering for correct pagination)
  let actorAdminIds: string[] | null = null;
  if (actorFilter) {
    const matched = await prisma.admin.findMany({
      where: {
        OR: [
          { name:  { contains: actorFilter } },
          { email: { contains: actorFilter } },
        ],
      },
      select: { id: true },
    });
    actorAdminIds = matched.map((a) => a.id);
  }

  const where = {
    ...(since ? { createdAt: { gte: since } } : {}),
    ...(actorAdminIds !== null ? { actorAdminId: { in: actorAdminIds } } : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.adminAudit.count({ where }),
    prisma.adminAudit.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const actorIds = Array.from(new Set(rows.map((r) => r.actorAdminId)));
  const actors = actorIds.length === 0
    ? []
    : await prisma.admin.findMany({
        where: { id: { in: actorIds } },
        select: { id: true, email: true, name: true },
      });

  const actorMap = Object.fromEntries(actors.map((a) => [a.id, a]));

  const serializedRows = rows.map((r) => ({
    id: r.id,
    action: r.action,
    createdAt: r.createdAt.toISOString(),
    ip: r.ip,
    actorAdminId: r.actorAdminId,
    before: r.before as Record<string, unknown> | null,
    after:  r.after  as Record<string, unknown> | null,
  }));

  return (
    <AuditContent
      filtered={serializedRows}
      actorMap={actorMap}
      period={period}
      actorFilter={actorFilter}
      total={total}
      page={page}
      totalPages={totalPages}
      pageNumbersList={pageNumbers(page, totalPages)}
    />
  );
}
