import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { verifyToken } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Row = {
  created_at: Date;
  description: string;
  credits_granted: number | null;
  amount: string;
  currency: string;
  status: string;
  gateway_ref: string | null;
};

function escapeCsv(v: string | number | null | undefined): string {
  if (v == null) return "";
  const s = String(v);
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  // Accept JWT via ?token= query param (allows direct browser download links)
  let userId: string | null = null;
  const queryToken = searchParams.get("token");
  if (queryToken) {
    const payload = await verifyToken(queryToken);
    if (payload?.kind === "user") userId = payload.sub;
  }

  // Fall back to NextAuth session
  if (!userId) {
    const session = await auth();
    userId = (session?.user as { id?: string } | undefined)?.id ?? null;
  }

  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hq = (searchParams.get("hq") ?? "").trim();
  const hs = (searchParams.get("hs") ?? "").trim();

  const whereParts = ["user_id = ?"];
  const params: (string | number)[] = [userId];
  if (hs) { whereParts.push("status = ?"); params.push(hs); }
  if (hq) {
    whereParts.push("(description LIKE ? OR gateway_ref LIKE ?)");
    params.push(`%${hq}%`, `%${hq}%`);
  }

  const rows = await prisma.$queryRawUnsafe<Row[]>(
    `SELECT created_at, description, credits_granted, amount, currency, status, gateway_ref
     FROM billing_history WHERE ${whereParts.join(" AND ")} ORDER BY created_at DESC`,
    ...params
  );

  const headers = ["Date", "Description", "Credits", "Amount", "Currency", "Status", "Gateway Ref"];
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        escapeCsv(new Date(r.created_at).toISOString().slice(0, 10)),
        escapeCsv(r.description),
        escapeCsv(r.credits_granted),
        escapeCsv(Number(r.amount).toFixed(2)),
        escapeCsv(r.currency),
        escapeCsv(r.status),
        escapeCsv(r.gateway_ref),
      ].join(",")
    ),
  ];

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="billing-history.csv"`,
    },
  });
}
