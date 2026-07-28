import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { getSystemCurrency } from "@/lib/currency";
import { PlanForm } from "../PlanForm";

export const dynamic = "force-dynamic";

export default async function NewPlanPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  const currency = await getSystemCurrency();

  return <PlanForm currencySymbol={currency.symbol} />;
}
