import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ShellLayout } from "@/components/ShellLayout";
import { getSystemCurrency } from "@/lib/currency";
import { getPaymentGateway } from "@/lib/payment/registry";
import { grantCreditsForPayment, recordFailedPayment } from "@/lib/payment/grant-credits";
import { buildStorageUrl } from "@/lib/storage-url";
import { BillingContent } from "./BillingContent";

export const dynamic = "force-dynamic";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: { success?: string; cancelled?: string; session_id?: string; gw?: string; hq?: string; hs?: string; hp?: string };
}) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/login");

  const paymentCancelled = searchParams.cancelled === "1";
  const hq    = (searchParams.hq ?? "").trim();
  const hs    = (searchParams.hs ?? "").trim();
  const HP_SIZE = 15;
  const hp    = Math.max(1, parseInt(searchParams.hp ?? "1", 10));
  const hSkip = (hp - 1) * HP_SIZE;

  // On success redirect from gateway: verify the session and grant credits
  let paymentSuccess = false;
  if (searchParams.success === "1" && searchParams.session_id && searchParams.gw) {
    const gatewaySlug = searchParams.gw;
    const sessionId   = searchParams.session_id;
    const impl = getPaymentGateway(gatewaySlug);
    if (impl) {
      const dbGateway = await prisma.gateway.findFirst({
        where: { name: gatewaySlug, type: "payment" },
        select: { credentials: true },
      });
      if (dbGateway) {
        const credentials = (dbGateway.credentials ?? {}) as Record<string, string>;
        try {
          const result = await impl.verifySession(credentials, sessionId);
          if (result) {
            // Keep BillingSession in sync so API polling also reflects the result
            await prisma.billingSession.updateMany({
              where: { sessionId },
              data:  { status: result.status },
            });
            if (result.status === "paid") {
              await grantCreditsForPayment(result, gatewaySlug);
              paymentSuccess = true;
            } else if (result.status === "failed") {
              await recordFailedPayment(result, gatewaySlug);
            }
          }
        } catch (e) {
          console.error("[billing/verify]", e);
        }
      }
    }
  }

  type HistoryRow = {
    id: string;
    description: string;
    gateway_ref: string | null;
    amount: string;
    currency: string;
    status: string;
    credits_granted: number | null;
    plan_id: string | null;
    created_at: Date;
  };

  // Build filtered history query
  const histWhere: string[] = ["user_id = ?"];
  const histParams: (string | number)[] = [userId];
  if (hs) { histWhere.push("status = ?"); histParams.push(hs); }
  if (hq) {
    histWhere.push("(description LIKE ? OR gateway_ref LIKE ?)");
    histParams.push(`%${hq}%`, `%${hq}%`);
  }
  const histWhereClause = histWhere.join(" AND ");

  const [user, plans, currency, history, historyTotal, lastPaidRows, dbGateways] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { creditsUsed: true, creditsTotal: true, planId: true },
    }),
    prisma.plan.findMany({ orderBy: { credits: "asc" } }),
    getSystemCurrency(),
    prisma.$queryRawUnsafe<HistoryRow[]>(
      `SELECT id, description, gateway_ref, amount, currency, status, credits_granted, plan_id, created_at
       FROM billing_history WHERE ${histWhereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      ...histParams, HP_SIZE, hSkip
    ),
    prisma.$queryRawUnsafe<[{ total: bigint }]>(
      `SELECT COUNT(*) AS total FROM billing_history WHERE user_id = ?`,
      userId
    ),
    prisma.$queryRawUnsafe<[{ plan_id: string | null }]>(
      `SELECT plan_id FROM billing_history WHERE user_id = ? AND status = 'paid' ORDER BY created_at DESC LIMIT 1`,
      userId
    ),
    prisma.gateway.findMany({
      where: { type: "payment", isActive: true },
      select: { id: true, name: true, credentials: true, config: true },
    }),
  ]);

  if (!user) redirect("/login");

  // Build safe (no-secrets) gateway list for the client
  const activeGateways = dbGateways
    .map((gw) => {
      const impl = getPaymentGateway(gw.name);
      if (!impl) return null;
      const config = (gw.config ?? {}) as Record<string, string>;
      return {
        id:    gw.id,
        slug:  gw.name,
        title: config.gateway_title ?? gw.name,
        logo:  config.gateway_image ? buildStorageUrl(`/storage/${config.gateway_image}`) : null,
      };
    })
    .filter((g): g is NonNullable<typeof g> => g !== null);

  const activePlans = plans.filter((p) => (p as { isActive?: boolean }).isActive !== false);

  const used      = user.creditsUsed;
  const total     = user.creditsTotal;
  const remaining = Math.max(0, total - used);
  const pct       = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  const totalHistoryCount = Number(historyTotal[0]?.total ?? 0);
  const hTotalPages = Math.max(1, Math.ceil(totalHistoryCount / HP_SIZE));

  // Prefer the plan persisted on the user (set on every paid purchase). Fall
  // back to the latest paid history row for users who bought before planId was
  // tracked, or right after a demo reset wipes the column.
  const currentPlanId = user.planId ?? lastPaidRows[0]?.plan_id ?? null;
  const currentPlan = currentPlanId
    ? activePlans.find((p) => p.id === currentPlanId) ?? null
    : null;

  const barColor = pct >= 90 ? "#ef4444" : pct >= 70 ? "#f59e0b" : "var(--accent)";
  const statusTone =
    pct >= 90 ? "bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20" :
    pct >= 70 ? "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20" :
                "bg-accent/10 text-accent border-accent/20";

  return (
    <ShellLayout title="Credits & billing" titleKey="billing.title" subtitle="Manage your plan and credit usage." subtitleKey="billing.subtitle">
      <BillingContent
        credits={{ used, total, remaining, pct, barColor, statusTone }}
        currentPlan={currentPlan ? { id: currentPlan.id, name: currentPlan.name, price: Number(currentPlan.price), credits: currentPlan.credits, recommended: !!currentPlan.recommended } : null}
        activePlans={activePlans.map(p => ({ id: p.id, name: p.name, price: Number(p.price), credits: p.credits, recommended: !!(p as { recommended?: boolean }).recommended }))}
        activeGateways={activeGateways}
        history={history.map(r => ({ ...r, created_at: new Date(r.created_at).toISOString() }))}
        historyMeta={{ total: totalHistoryCount, hq, hs, hp, hTotalPages }}
        currency={typeof currency === "string" ? currency : (currency as { code?: string })?.code ?? "USD"}
        paymentSuccess={paymentSuccess}
        paymentCancelled={paymentCancelled}
      />
    </ShellLayout>
  );
}
