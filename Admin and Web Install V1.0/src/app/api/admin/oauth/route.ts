import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-helpers";
import { getSettingsMap, upsertSettings } from "@/lib/settings";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

const putSchema = z.object({
  provider: z.literal("google"),
  enabled: z.boolean(),
  clientId: z.string().max(512),
  clientSecret: z.string().max(512),
});

function maskSecret(value: string): string {
  if (!value || value.length <= 4) return "****";
  return "****" + value.slice(-4);
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  const s = await getSettingsMap();

  return NextResponse.json({
    google: {
      enabled: s["oauth.google.enabled"] === "true",
      clientId: s["oauth.google.clientId"] || "",
      clientSecret: maskSecret(s["oauth.google.clientSecret"] || ""),
    },
  });
}

export async function PUT(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = putSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { enabled, clientId, clientSecret } = parsed.data;

  await upsertSettings([
    { key: "oauth.google.enabled", value: enabled ? "true" : "false", category: "oauth" },
    { key: "oauth.google.clientId", value: clientId.trim(), category: "oauth" },
    // Only update the secret if a non-masked value is provided
    ...(clientSecret && !clientSecret.startsWith("****")
      ? [{ key: "oauth.google.clientSecret", value: clientSecret.trim(), category: "oauth" }]
      : []),
  ]);

  revalidatePath("/admin/third-party/oauth");
  revalidatePath("/login");
  revalidatePath("/register");

  return NextResponse.json({ ok: true });
}
