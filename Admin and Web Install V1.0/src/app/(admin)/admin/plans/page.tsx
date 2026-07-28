import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { getSystemCurrency } from "@/lib/currency";
import { PlansContent } from "./PlansContent";

export const dynamic = "force-dynamic";

export default async function AdminPlansPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  const q = (searchParams.q ?? "").trim();

  const where = q
    ? { name: { contains: q } }
    : undefined;

  const [total, plans, currency] = await Promise.all([
    prisma.plan.count(),
    prisma.plan.findMany({
      where,
      orderBy: { createdAt: "asc" },
    }),
    getSystemCurrency(),
  ]);

  const allPlans = await (q ? prisma.plan.findMany({ orderBy: { createdAt: "asc" } }) : Promise.resolve(plans));
  const maxCredits = allPlans.length > 0 ? Math.max(...allPlans.map((p) => p.credits)) : 0;
  const minCredits = allPlans.length > 0 ? Math.min(...allPlans.map((p) => p.credits)) : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-[1100px] mx-auto">
      <PlansContent
        plans={plans}
        total={total}
        maxCredits={maxCredits}
        minCredits={minCredits}
        q={q}
        currencySymbol={currency.symbol}
      />
    </div>
  );
}
