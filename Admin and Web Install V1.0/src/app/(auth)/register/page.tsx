import { AuthShell } from "@/components/AuthShell";
import { getSettingsMap } from "@/lib/settings";
import { RegisterForm } from "./RegisterForm";

export default async function RegisterPage() {
  const s = await getSettingsMap();
  const enabled = s["business.free_credit_enabled"] === "true";
  const amount  = parseInt(s["business.free_credit_amount"] ?? "0", 10);
  const freeCredits = enabled && amount > 0 ? amount : 10;
  const googleEnabled = s["oauth.google.enabled"] === "true"
    && Boolean(s["oauth.google.clientId"])
    && Boolean(s["oauth.google.clientSecret"]);

  return (
    <AuthShell>
      <RegisterForm freeCredits={freeCredits} googleEnabled={googleEnabled} />
    </AuthShell>
  );
}
