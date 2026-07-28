import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { getSettingsMap } from "@/lib/settings";
import { FirebaseForm } from "./FirebaseForm";
import { FirebasePageHeading } from "./FirebasePageHeading";

export const dynamic = "force-dynamic";

function maskPrivateKey(raw: string): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  let keyToMask = trimmed;
  if (trimmed.startsWith("{")) {
    try {
      const sa = JSON.parse(trimmed) as { private_key?: string };
      keyToMask = sa.private_key ?? trimmed;
    } catch { /* fall through */ }
  }
  return "****" + keyToMask.trimEnd().slice(-4);
}

export default async function FirebasePage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  const s = await getSettingsMap();

  const initial = {
    enabled:           s["firebase.enabled"] === "true",
    // Server-side (Admin SDK)
    projectId:         s["firebase.projectId"]         ?? "",
    clientEmail:       s["firebase.clientEmail"]       ?? "",
    privateKey:        maskPrivateKey(s["firebase.privateKey"] ?? ""),
    vapidKey:          s["firebase.vapidKey"]          ?? "",
    // Client SDK config
    apiKey:            s["firebase.apiKey"]            ?? "",
    authDomain:        s["firebase.authDomain"]        ?? "",
    storageBucket:     s["firebase.storageBucket"]     ?? "",
    messagingSenderId: s["firebase.messagingSenderId"] ?? "",
    appId:             s["firebase.appId"]             ?? "",
    measurementId:     s["firebase.measurementId"]     ?? "",
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1200px] mx-auto">
      <FirebasePageHeading />

      <FirebaseForm initial={initial} />
    </div>
  );
}
