import { cache } from "react";
import { prisma } from "@/lib/prisma";

export type SettingRow = { key: string; value: string; category: string };

/** Fetch all settings in one query. Cached per request. */
export const getAllSettings = cache(async (): Promise<SettingRow[]> => {
  return prisma.setting.findMany({
    select: { key: true, value: true, category: true },
  });
});

/** Map of key → value across every category. */
export async function getSettingsMap(): Promise<Record<string, string>> {
  const rows = await getAllSettings();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

/** Only the rows for one tab (category). */
export async function getSettingsByCategory(category: string): Promise<SettingRow[]> {
  const rows = await getAllSettings();
  return rows.filter((r) => r.category === category);
}

/** Single value lookup with fallback. */
export async function getSetting(key: string, fallback = ""): Promise<string> {
  const rows = await getAllSettings();
  return rows.find((r) => r.key === key)?.value ?? fallback;
}

/**
 * Upsert multiple settings at once. Used by the admin settings form.
 * New keys are created with the provided category; existing keys only update value.
 */
export async function upsertSettings(
  entries: { key: string; value: string; category?: string }[],
): Promise<void> {
  await prisma.$transaction(
    entries.map((e) =>
      prisma.setting.upsert({
        where: { key: e.key },
        update: { value: e.value },
        create: { key: e.key, value: e.value, category: e.category ?? "general" },
      }),
    ),
  );
}
