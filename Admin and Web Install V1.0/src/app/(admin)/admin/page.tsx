import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { collectMetrics } from "@/lib/metrics";
import { DashboardContent } from "./DashboardContent";

export const dynamic = "force-dynamic";

export default async function AdminMetricsPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/");

  const m = await collectMetrics();

  return <DashboardContent m={m} />;
}
