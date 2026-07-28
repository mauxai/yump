import { redirect, notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { getSystemCurrency } from "@/lib/currency";
import { PlanForm } from "../../PlanForm";

export const dynamic = "force-dynamic";

export default async function EditPlanPage({ params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  const [plan, currency] = await Promise.all([
    prisma.plan.findUnique({ where: { id: params.id } }),
    getSystemCurrency(),
  ]);
  if (!plan) notFound();

  return (
    <PlanForm
      initial={{ id: plan.id, name: plan.name, credits: plan.credits, price: Number(plan.price) }}
      currencySymbol={currency.symbol}
    />
  );
}
