"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/audit";
import { getClientIp } from "@/lib/get-ip";
import { getLanguageByCode } from "@/lib/language-options";
import { generateI18nFile } from "@/lib/i18n-generator";
import { existsSync, unlinkSync } from "fs";
import path from "path";

const MESSAGES_DIR = path.join(process.cwd(), "messages");

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function addLanguage(
  code: string,
  direction?: "ltr" | "rtl",
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const langDef = getLanguageByCode(code);
  if (!langDef) return { ok: false, error: "Unknown language code." };

  const existing = await prisma.language.findUnique({ where: { code } });
  if (existing) return { ok: false, error: "Language already added." };

  const count = await prisma.language.count();
  const isFirst = count === 0;

  const language = await prisma.language.create({
    data: {
      code: langDef.code,
      name: langDef.name,
      nativeName: langDef.nativeName,
      direction: direction ?? langDef.direction,
      isDefault: isFirst,
      isActive: true,
    },
  });

  generateI18nFile(code);

  await logAdminAction(admin.id, "LANGUAGE_CREATE", {
    targetType: "language",
    targetId: language.id,
    ip: getClientIp(),
    after: { code, name: langDef.name, nativeName: langDef.nativeName },
  });

  revalidatePath("/admin/languages");
  return { ok: true };
}

export async function removeLanguage(id: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const language = await prisma.language.findUnique({ where: { id } });
  if (!language) return { ok: false, error: "Language not found." };
  if (language.isDefault) return { ok: false, error: "Cannot delete the default language. Set another language as default first." };
  if (language.code === "en") return { ok: false, error: "English cannot be deleted — it is the base fallback for all translations." };

  await prisma.language.delete({ where: { id } });

  // Delete the translation file from disk
  const jsonFile = path.join(MESSAGES_DIR, `${language.code}.json`);
  if (existsSync(jsonFile)) unlinkSync(jsonFile);

  await logAdminAction(admin.id, "LANGUAGE_DELETE", {
    targetType: "language",
    targetId: id,
    ip: getClientIp(),
    before: { code: language.code, name: language.name },
  });

  revalidatePath("/admin/languages");
  return { ok: true };
}

export async function setDefaultLanguage(id: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const language = await prisma.language.findUnique({ where: { id } });
  if (!language) return { ok: false, error: "Language not found." };
  if (!language.isActive) return { ok: false, error: "Cannot set an inactive language as default." };

  await prisma.$transaction([
    prisma.language.updateMany({ data: { isDefault: false } }),
    prisma.language.update({ where: { id }, data: { isDefault: true } }),
  ]);

  await logAdminAction(admin.id, "LANGUAGE_UPDATE", {
    targetType: "language",
    targetId: id,
    ip: getClientIp(),
    after: { code: language.code, isDefault: true },
  });

  revalidatePath("/admin/languages");
  return { ok: true };
}

export async function toggleLanguage(id: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const language = await prisma.language.findUnique({ where: { id } });
  if (!language) return { ok: false, error: "Language not found." };
  if (language.isDefault && language.isActive) {
    return { ok: false, error: "Cannot disable the default language." };
  }
  if (language.code === "en") {
    return { ok: false, error: "English cannot be disabled — it is the base fallback for all translations." };
  }

  const updated = await prisma.language.update({
    where: { id },
    data: { isActive: !language.isActive },
  });

  await logAdminAction(admin.id, "LANGUAGE_UPDATE", {
    targetType: "language",
    targetId: id,
    ip: getClientIp(),
    after: { code: language.code, isActive: updated.isActive },
  });

  revalidatePath("/admin/languages");
  return { ok: true };
}

/** Return language codes that are already in the DB — used to filter the add picker. */
export async function getAddedCodes(): Promise<string[]> {
  const rows = await prisma.language.findMany({ select: { code: true } });
  return rows.map((r) => r.code);
}
