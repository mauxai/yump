import { NextResponse } from "next/server";
import { getSettingsMap } from "@/lib/settings";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/firebase/config
 *
 * Returns the Firebase client SDK configuration. No auth required —
 * these values are safe to embed in client apps (same as having them in google-services.json).
 * Returns an empty object with enabled:false when Firebase is not configured.
 */
export async function GET() {
  const s = await getSettingsMap();

  const enabled = s["firebase.enabled"] === "true";

  if (!enabled) {
    return NextResponse.json({ enabled: false });
  }

  return NextResponse.json({
    enabled:           true,
    apiKey:            s["firebase.apiKey"]            ?? "",
    authDomain:        s["firebase.authDomain"]        ?? "",
    projectId:         s["firebase.projectId"]         ?? "",
    storageBucket:     s["firebase.storageBucket"]     ?? "",
    messagingSenderId: s["firebase.messagingSenderId"] ?? "",
    appId:             s["firebase.appId"]             ?? "",
    measurementId:     s["firebase.measurementId"]     ?? "",
    vapidKey:          s["firebase.vapidKey"]          ?? "",
  });
}
