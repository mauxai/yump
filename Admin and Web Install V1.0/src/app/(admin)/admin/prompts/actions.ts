"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-helpers";
import { upsertSettings, getSettingsMap } from "@/lib/settings";
import { logAdminAction } from "@/lib/audit";
import { getClientIp } from "@/lib/get-ip";

export type SaveResult = { ok: true } | { ok: false; error: string };

export async function savePrompts(prompts: string[]): Promise<SaveResult> {
  try {
    const admin = await requireAdmin();
    console.log("[savePrompts] admin:", admin ? admin.id : "null");
    if (!admin) return { ok: false, error: "Not authorized." };

    const cleaned = prompts.map((p) => p.trim()).filter(Boolean).slice(0, 20);
    const value = JSON.stringify(cleaned);
    console.log("[savePrompts] writing value:", value);

    const allSettings = await getSettingsMap();
    const ip = getClientIp();

    await upsertSettings([{ key: "editor.suggestedPrompts", value, category: "editor" }]);
    console.log("[savePrompts] upsert done");

    await logAdminAction(admin.id, "SETTINGS_UPDATE", {
      ip,
      before: { "editor.suggestedPrompts": allSettings["editor.suggestedPrompts"] ?? "" },
      after:  { "editor.suggestedPrompts": value },
      meta: { category: "editor", keys: ["editor.suggestedPrompts"] },
    });

    revalidatePath("/admin/prompts");
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    console.error("[savePrompts]", e);
    return { ok: false, error: e instanceof Error ? e.message : "Failed to save prompts." };
  }
}
