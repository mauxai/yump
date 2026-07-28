import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-helpers";
import { getSettingsMap, upsertSettings } from "@/lib/settings";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

const putSchema = z.object({
  enabled:           z.boolean(),
  // Server-side (Admin SDK)
  projectId:         z.string().max(256),
  clientEmail:       z.string().max(512),
  privateKey:        z.string().max(8192),
  vapidKey:          z.string().max(512).optional().default(""),
  // Client-side SDK config
  apiKey:            z.string().max(512).optional().default(""),
  authDomain:        z.string().max(256).optional().default(""),
  storageBucket:     z.string().max(256).optional().default(""),
  messagingSenderId: z.string().max(64).optional().default(""),
  appId:             z.string().max(256).optional().default(""),
  measurementId:     z.string().max(64).optional().default(""),
});

function maskKey(value: string): string {
  if (!value) return "****";
  // If a full service-account JSON was stored, extract the private_key for masking
  const trimmed = value.trim();
  let keyToMask = trimmed;
  if (trimmed.startsWith("{")) {
    try {
      const sa = JSON.parse(trimmed) as { private_key?: string };
      keyToMask = sa.private_key ?? trimmed;
    } catch {
      // fall through — mask the raw value
    }
  }
  // Show last 4 non-whitespace chars of the actual key
  const tail = keyToMask.trimEnd().slice(-4);
  return "****" + tail;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  const s = await getSettingsMap();

  return NextResponse.json({
    enabled:           s["firebase.enabled"] === "true",
    // Server-side
    projectId:         s["firebase.projectId"]         ?? "",
    clientEmail:       s["firebase.clientEmail"]       ?? "",
    privateKey:        maskKey(s["firebase.privateKey"] ?? ""),
    vapidKey:          s["firebase.vapidKey"]          ?? "",
    // Client SDK
    apiKey:            s["firebase.apiKey"]            ?? "",
    authDomain:        s["firebase.authDomain"]        ?? "",
    storageBucket:     s["firebase.storageBucket"]     ?? "",
    messagingSenderId: s["firebase.messagingSenderId"] ?? "",
    appId:             s["firebase.appId"]             ?? "",
    measurementId:     s["firebase.measurementId"]     ?? "",
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

  const d = parsed.data;

  await upsertSettings([
    // Global
    { key: "firebase.enabled",           value: d.enabled ? "true" : "false", category: "firebase" },
    // Server-side (Admin SDK)
    { key: "firebase.projectId",         value: d.projectId.trim(),         category: "firebase" },
    { key: "firebase.clientEmail",       value: d.clientEmail.trim(),       category: "firebase" },
    { key: "firebase.vapidKey",          value: d.vapidKey.trim(),          category: "firebase" },
    // Client SDK config
    { key: "firebase.apiKey",            value: d.apiKey.trim(),            category: "firebase" },
    { key: "firebase.authDomain",        value: d.authDomain.trim(),        category: "firebase" },
    { key: "firebase.storageBucket",     value: d.storageBucket.trim(),     category: "firebase" },
    { key: "firebase.messagingSenderId", value: d.messagingSenderId.trim(), category: "firebase" },
    { key: "firebase.appId",             value: d.appId.trim(),             category: "firebase" },
    { key: "firebase.measurementId",     value: d.measurementId.trim(),     category: "firebase" },
    // Only update privateKey when a real (non-masked) value is submitted
    ...(d.privateKey && !d.privateKey.startsWith("****")
      ? [{ key: "firebase.privateKey", value: d.privateKey.trim(), category: "firebase" }]
      : []),
  ]);

  revalidatePath("/admin/third-party/firebase");

  return NextResponse.json({ ok: true });
}
