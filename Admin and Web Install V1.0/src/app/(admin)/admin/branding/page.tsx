import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { getSettingsByCategory } from "@/lib/settings";
import { BrandingForm } from "./BrandingForm";

export const dynamic = "force-dynamic";

export default async function AdminBrandingPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  const rows = await getSettingsByCategory("branding");
  const s = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const map = s;

  return (
    <BrandingForm
      initial={{
        name: map["brand.name"] ?? "",
        slogan: map["brand.slogan"] ?? "",
        logo: map["brand.logo"] ?? "",
        favicon: map["brand.favicon"] ?? "",
        primaryDark:  s["brand.primaryDark"]  || "#a3e635",
        primaryLight: s["brand.primaryLight"] || "#4d7c0f",
        sketchColor:  s["editor.sketchColor"] || "#00e676",
      }}
    />
  );
}
