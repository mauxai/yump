import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { getSettingsByCategory } from "@/lib/settings";
import { BusinessForm } from "./BusinessForm";
import { BusinessPageHeading } from "./BusinessPageHeading";

export const dynamic = "force-dynamic";

export default async function BusinessPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  const rows = await getSettingsByCategory("business");
  const s = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  return (
    <div className="max-w-[1100px] mx-auto p-4 sm:p-6 lg:p-10">
      <BusinessPageHeading />

      <BusinessForm
        initial={{
          freeCreditEnabled: s["business.free_credit_enabled"] === "true",
          freeCreditAmount:  parseInt(s["business.free_credit_amount"] ?? "0", 10) || 0,
        }}
      />
    </div>
  );
}
