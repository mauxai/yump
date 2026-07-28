import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { getSettingsMap } from "@/lib/settings";
import { SmtpForm } from "./SmtpForm";
import { SmtpPageHeading } from "./SmtpPageHeading";

export const dynamic = "force-dynamic";

export default async function AdminSmtpPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  const s = await getSettingsMap();

  return (
    <div className="max-w-[1100px] mx-auto p-4 sm:p-6 lg:p-10">
      <SmtpPageHeading />

      <SmtpForm
        initial={{
          host:   s["smtp.host"]   ?? "",
          port:   s["smtp.port"]   ?? "587",
          user:   s["smtp.user"]   ?? "",
          pass:   s["smtp.pass"]   ?? "",
          from:   s["smtp.from"]   ?? "",
          secure: s["smtp.secure"] ?? "false",
        }}
      />
    </div>
  );
}
