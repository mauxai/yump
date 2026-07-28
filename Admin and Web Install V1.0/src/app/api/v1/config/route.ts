import { NextResponse } from "next/server";
import { getSettingsMap } from "@/lib/settings";
import { buildAvatarUrl } from "@/lib/storage-url";
import { CURRENCIES } from "@/lib/locale-options";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getSettingsMap().catch(() => ({} as Record<string, string>));

  // Active OAuth providers
  const oauth: { provider: string; name: string }[] = [];
  if (s["oauth.google.enabled"] === "true" && s["oauth.google.clientId"]) {
    oauth.push({ provider: "google", name: "Google" });
  }

  // Logo — convert stored filename to absolute URL if needed
  const rawLogo = s["brand.logo"] || null;
  const logo =
    rawLogo && (rawLogo.startsWith("http") || rawLogo.startsWith("data:"))
      ? rawLogo
      : buildAvatarUrl(rawLogo);

  return NextResponse.json({
    is_demo: process.env.NEXT_PUBLIC_IS_DEMO_MODE === "true",
    brand: {
      name:     s["brand.name"]   || "6amStudio",
      slogan:   s["brand.slogan"] || "",
      logo,
    },
    general: {
      country:        s["general.country"]  || "US",
      currency:       s["general.currency"] || "USD",
      currencySymbol: CURRENCIES.find((c) => c.code === (s["general.currency"] || "USD"))?.symbol ?? "$",
    },
    oauth,
  });
}
