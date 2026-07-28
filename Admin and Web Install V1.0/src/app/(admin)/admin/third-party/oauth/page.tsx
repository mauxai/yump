import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { getSettingsMap } from "@/lib/settings";
import { OAuthForm } from "./OAuthForm";
import { OAuthPageHeading } from "./OAuthPageHeading";

export const dynamic = "force-dynamic";

export default async function OAuthPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  const s = await getSettingsMap();

  const initial = {
    enabled: s["oauth.google.enabled"] === "true",
    clientId: s["oauth.google.clientId"] || "",
    // Pass masked secret — form will handle not overwriting with masked value
    clientSecret: s["oauth.google.clientSecret"]
      ? "****" + (s["oauth.google.clientSecret"].slice(-4) || "")
      : "",
  };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1200px] mx-auto">
      <OAuthPageHeading />

      <OAuthForm initial={initial} appUrl={appUrl} />
    </div>
  );
}
