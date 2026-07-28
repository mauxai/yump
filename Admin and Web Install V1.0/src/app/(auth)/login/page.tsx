import { Suspense } from "react";
import { AuthShell } from "@/components/AuthShell";
import { getSettingsMap } from "@/lib/settings";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const s = await getSettingsMap();
  const brandName = s["brand.name"] || "6amStudio";
  const googleEnabled = s["oauth.google.enabled"] === "true"
    && Boolean(s["oauth.google.clientId"])
    && Boolean(s["oauth.google.clientSecret"]);

  return (
    <AuthShell>
      <Suspense fallback={null}>
        <LoginForm brandName={brandName} googleEnabled={googleEnabled} />
      </Suspense>
    </AuthShell>
  );
}
