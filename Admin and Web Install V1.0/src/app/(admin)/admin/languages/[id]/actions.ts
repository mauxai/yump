"use server";

import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { translateText } from "@/lib/translate";
import { flattenJson, unflattenJson } from "@/lib/translation-utils";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import path from "path";

const MESSAGES_DIR = path.join(process.cwd(), "messages");

// ─── Private helpers (not exported — not server actions) ──────────────────────

function readLocaleFile(code: string): Record<string, string> {
  const file = path.join(MESSAGES_DIR, `${code}.json`);
  if (!existsSync(file)) return {};
  try {
    return flattenJson(JSON.parse(readFileSync(file, "utf-8")));
  } catch {
    return {};
  }
}

function readEnBase(): Record<string, string> {
  return readLocaleFile("en");
}

// ─── Server Actions ────────────────────────────────────────────────────────────

/** Load both the English base and the target language translations (flat). */
export async function loadTranslations(langId: string): Promise<{
  ok: boolean;
  error?: string;
  langCode?: string;
  langName?: string;
  nativeName?: string;
  base?: Record<string, string>;
  translations?: Record<string, string>;
}> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const lang = await prisma.language.findUnique({ where: { id: langId } });
  if (!lang) return { ok: false, error: "Language not found." };

  const base = readEnBase();
  const translations = readLocaleFile(lang.code);

  return {
    ok: true,
    langCode: lang.code,
    langName: lang.name,
    nativeName: lang.nativeName,
    base,
    translations,
  };
}

/** Translate a single key and return the translated string. Does NOT save. */
export async function translateKey(
  langId: string,
  key: string,
  sourceText: string,
): Promise<{ ok: boolean; text?: string; error?: string }> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const lang = await prisma.language.findUnique({ where: { id: langId } });
  if (!lang) return { ok: false, error: "Language not found." };

  if (lang.code === "en") return { ok: true, text: sourceText };

  const result = await translateText(sourceText, lang.name, lang.code);
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, text: result.text };
}

/** Save the full flat translations map to messages/{code}.json */
export async function saveTranslations(
  langId: string,
  translations: Record<string, string>,
): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const lang = await prisma.language.findUnique({ where: { id: langId } });
  if (!lang) return { ok: false, error: "Language not found." };

  if (!existsSync(MESSAGES_DIR)) mkdirSync(MESSAGES_DIR, { recursive: true });

  const nested = unflattenJson(translations);
  const file = path.join(MESSAGES_DIR, `${lang.code}.json`);
  writeFileSync(file, JSON.stringify(nested, null, 2), "utf-8");

  return { ok: true };
}
