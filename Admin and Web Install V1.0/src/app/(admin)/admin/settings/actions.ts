"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-helpers";
import { upsertSettings, getSettingsMap } from "@/lib/settings";
import { logAdminAction } from "@/lib/audit";
import { getClientIp } from "@/lib/get-ip";

export type SaveResult = { ok: true } | { ok: false; error: string };

export async function saveSettings(
  category: string,
  entries: { key: string; value: string }[],
): Promise<SaveResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const safeCategory = category.replace(/[^a-z0-9_-]/gi, "").slice(0, 32) || "general";
  const cleaned = entries
    .filter((e) => typeof e.key === "string" && e.key.length > 0 && e.key.length <= 100)
    .map((e) => ({ key: e.key, value: String(e.value ?? ""), category: safeCategory }));

  if (cleaned.length === 0) return { ok: false, error: "Nothing to save." };

  const allSettings = await getSettingsMap();
  const beforeState: Record<string, string> = {};
  const afterState: Record<string, string> = {};
  for (const e of cleaned) {
    beforeState[e.key] = allSettings[e.key] ?? "";
    afterState[e.key] = e.value;
  }

  const ip = getClientIp();

  await upsertSettings(cleaned);

  await logAdminAction(admin.id, "SETTINGS_UPDATE", {
    ip,
    before: beforeState,
    after: afterState,
    meta: { category: safeCategory, keys: cleaned.map((c) => c.key) },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
  return { ok: true };
}
