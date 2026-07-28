import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-helpers";
import { upsertSettings, getSettingsMap, getSetting } from "@/lib/settings";
import { logAdminAction } from "@/lib/audit";
import { getClientIp } from "@/lib/get-ip";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

const schema = z.object({
  prompts: z.array(z.string()).max(20),
});

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  const raw = await getSetting("editor.suggestedPrompts", "[]");
  let prompts: string[] = [];
  try { prompts = JSON.parse(raw); } catch { prompts = []; }

  return NextResponse.json({ prompts });
}

export async function PUT(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const cleaned = parsed.data.prompts.map((p) => p.trim()).filter(Boolean).slice(0, 20);
  const value = JSON.stringify(cleaned);

  const allSettings = await getSettingsMap();
  const ip = getClientIp();

  await upsertSettings([{ key: "editor.suggestedPrompts", value, category: "editor" }]);

  await logAdminAction(admin.id, "SETTINGS_UPDATE", {
    ip,
    before: { "editor.suggestedPrompts": allSettings["editor.suggestedPrompts"] ?? "" },
    after:  { "editor.suggestedPrompts": value },
    meta: { category: "editor", keys: ["editor.suggestedPrompts"] },
  });

  revalidatePath("/admin/prompts");
  revalidatePath("/", "layout");

  return NextResponse.json({ ok: true, prompts: cleaned });
}
