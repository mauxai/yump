import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { TransactionsContent } from "./TransactionsContent";
import type { TxRow } from "./TransactionTable";

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

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

export default async function AdminTransactionsPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; page?: string };
}) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  const q      = (searchParams.q ?? "").trim();
  const status = (searchParams.status ?? "").trim();
  const page   = Math.max(1, parseInt(searchParams.page ?? "1", 10));
  const skip   = (page - 1) * PAGE_SIZE;

  const where = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { description: { contains: q } },
            { gatewayRef:  { contains: q } },
            { user: { email: { contains: q } } },
          ],
        }
      : {}),
  };

  // Build dynamic SQL for the rows query (bypasses stale Prisma client to get credits_granted)
  const whereParts: string[] = [];
  const whereParams: (string | number)[] = [];
  if (status) { whereParts.push("bh.status = ?"); whereParams.push(status); }
  if (q) {
    whereParts.push("(bh.description LIKE ? OR bh.gateway_ref LIKE ? OR u.email LIKE ?)");
    whereParams.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";

  const [total, rows, stats] = await Promise.all([
    prisma.billingHistory.count({ where }),
    prisma.$queryRawUnsafe<TxRow[]>(
      `SELECT bh.id, bh.user_id, bh.description, bh.gateway_ref, bh.amount, bh.currency,
              bh.status, bh.credits_granted, bh.created_at,
              u.name AS user_name, u.email AS user_email
       FROM billing_history bh
       LEFT JOIN users u ON u.id = bh.user_id
       ${whereClause}
       ORDER BY bh.created_at DESC
       LIMIT ? OFFSET ?`,
      ...whereParams, PAGE_SIZE, skip
    ),
    prisma.billingHistory.groupBy({
      by: ["status"],
      _count: { id: true },
      _sum:   { amount: true },
    }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Build stats map
  const statMap: Record<string, { count: number; sum: number }> = {};
  for (const s of stats) {
    statMap[s.status] = { count: s._count.id, sum: Number(s._sum.amount ?? 0) };
  }
  const totalRevenue = (statMap.paid?.sum ?? 0).toFixed(2);
  const totalPaid    = statMap.paid?.count ?? 0;
  const totalFailed  = statMap.failed?.count ?? 0;
  const totalPending = statMap.pending?.count ?? 0;

  const exportParams = new URLSearchParams({ ...(q ? { q } : {}), ...(status ? { status } : {}) });
  const exportUrl = `/api/admin/transactions/export${exportParams.toString() ? `?${exportParams}` : ""}`;

  // Convert Decimal → string so RSC can serialize rows to Client Components
  const plainRows = rows.map((r) => ({ ...r, amount: String(r.amount) }));

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-[1200px] mx-auto">
      <TransactionsContent
          rows={plainRows}
          total={total}
          totalPages={totalPages}
          totalRevenue={totalRevenue}
          totalPaid={totalPaid}
          totalFailed={totalFailed}
          totalPending={totalPending}
          q={q}
          status={status}
          page={page}
          exportUrl={exportUrl}
          pageNumbersList={pageNumbers(page, totalPages)}
        />
    </div>
  );
}
