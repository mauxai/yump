import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/utils/error-handler";

export const dynamic = "force-dynamic";

function unauthorized401() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function fillDates(
  rows: Array<{ date: string; value: number }>,
  from: Date,
  to: Date,
  groupBy: "day" | "month",
): Array<{ date: string; value: number }> {
  const map = new Map(rows.map((r) => [r.date, r.value]));
  const result: Array<{ date: string; value: number }> = [];

  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(23, 59, 59, 999);

  if (groupBy === "month") {
    cursor.setDate(1);
    while (cursor <= end) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
      result.push({ date: key, value: map.get(key) ?? 0 });
      cursor.setMonth(cursor.getMonth() + 1);
    }
  } else {
    while (cursor <= end) {
      const key = cursor.toISOString().slice(0, 10);
      result.push({ date: key, value: map.get(key) ?? 0 });
      cursor.setDate(cursor.getDate() + 1);
    }
  }
  return result;
}

export async function GET(req: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) return unauthorized401();

    const { searchParams } = new URL(req.url);

    const defaultFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const defaultTo   = new Date();

    const fromParam = searchParams.get("from");
    const toParam   = searchParams.get("to");
    const groupBy   = (searchParams.get("groupBy") ?? "day") === "month" ? "month" : "day";

    const from = fromParam ? new Date(fromParam) : defaultFrom;
    const to   = toParam   ? new Date(toParam)   : defaultTo;

    const fmt = groupBy === "month" ? "%Y-%m" : "%Y-%m-%d";

    const [editsDaily, usersDaily, revenueDaily, modelDaily, modelUsage] = await Promise.all([
      prisma.$queryRawUnsafe<Array<{ date: string; value: bigint | number | string }>>(
        `SELECT DATE_FORMAT(created_at, '${fmt}') as date, COUNT(*) as value
         FROM edits
         WHERE created_at BETWEEN ? AND ?
         GROUP BY date ORDER BY date`,
        from,
        to,
      ),
      prisma.$queryRawUnsafe<Array<{ date: string; value: bigint | number | string }>>(
        `SELECT DATE_FORMAT(created_at, '${fmt}') as date, COUNT(*) as value
         FROM users
         WHERE created_at BETWEEN ? AND ?
         GROUP BY date ORDER BY date`,
        from,
        to,
      ),
      prisma.$queryRawUnsafe<Array<{ date: string; value: bigint | number | string }>>(
        `SELECT DATE_FORMAT(created_at, '${fmt}') as date, SUM(amount) as value
         FROM billing_history
         WHERE status='paid' AND created_at BETWEEN ? AND ?
         GROUP BY date ORDER BY date`,
        from,
        to,
      ),
      prisma.$queryRawUnsafe<Array<{ date: string; modelId: string | null; label: string; edits: bigint; credits: bigint }>>(
        `SELECT DATE_FORMAT(e.created_at, '${fmt}') as date, e.ai_model_id as modelId,
                COALESCE(m.label,'Unknown') as label,
                COUNT(*) as edits, SUM(e.credit_cost) as credits
         FROM edits e LEFT JOIN ai_models m ON m.id = e.ai_model_id
         WHERE e.created_at BETWEEN ? AND ? AND e.ai_model_id IS NOT NULL
         GROUP BY date, e.ai_model_id, m.label ORDER BY date, edits DESC`,
        from,
        to,
      ),
      prisma.$queryRawUnsafe<Array<{ modelId: string | null; label: string; edits: bigint; credits: bigint }>>(
        `SELECT e.ai_model_id as modelId, COALESCE(m.label,'Unknown') as label,
                COUNT(*) as edits, SUM(e.credit_cost) as credits
         FROM edits e LEFT JOIN ai_models m ON m.id = e.ai_model_id
         WHERE e.created_at BETWEEN ? AND ? AND e.ai_model_id IS NOT NULL
         GROUP BY e.ai_model_id, m.label ORDER BY edits DESC LIMIT 10`,
        from,
        to,
      ),
    ]);

    const editsSeries   = fillDates(editsDaily.map((r)   => ({ date: r.date, value: Number(r.value) })),   from, to, groupBy);
    const usersSeries   = fillDates(usersDaily.map((r)   => ({ date: r.date, value: Number(r.value) })),   from, to, groupBy);
    const revenueSeries = fillDates(revenueDaily.map((r) => ({ date: r.date, value: Number(r.value) })), from, to, groupBy);

    return NextResponse.json({
      editsDaily:   editsSeries,
      usersDaily:   usersSeries,
      revenueDaily: revenueSeries,
      modelDaily:   modelDaily.map((r)   => ({
        date:    r.date,
        modelId: r.modelId,
        label:   r.label,
        edits:   Number(r.edits),
        credits: Number(r.credits),
      })),
      modelUsage: modelUsage.map((r) => ({
        modelId: r.modelId,
        label:   r.label,
        edits:   Number(r.edits),
        credits: Number(r.credits),
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
