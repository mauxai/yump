import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { GatewayForm } from "../GatewayForm";

export const dynamic = "force-dynamic";

export default async function NewGatewayPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  return <GatewayForm />;
}
