import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

const MESSAGES_DIR = path.join(process.cwd(), "messages");
const BASE_LOCALE = "en";

function emptyStringValues(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    result[k] =
      typeof v === "object" && v !== null && !Array.isArray(v)
        ? emptyStringValues(v as Record<string, unknown>)
        : "";
  }
  return result;
}

/** Create the translation file for `code` inside messages/.
 *  - English: written as-is (it is the source of truth).
 *  - Other languages: same JSON structure but all string values set to ""
 *    so the editor correctly shows them as untranslated.
 *  Never overwrites an existing file. */
export function generateI18nFile(code: string): void {
  if (!existsSync(MESSAGES_DIR)) {
    mkdirSync(MESSAGES_DIR, { recursive: true });
  }

  const targetFile = path.join(MESSAGES_DIR, `${code}.json`);
  if (existsSync(targetFile)) return;

  const baseFile = path.join(MESSAGES_DIR, `${BASE_LOCALE}.json`);
  const template = existsSync(baseFile)
    ? JSON.parse(readFileSync(baseFile, "utf-8"))
    : {};

  const content =
    code === BASE_LOCALE ? template : emptyStringValues(template);

  writeFileSync(targetFile, JSON.stringify(content, null, 2), "utf-8");
}

/** Return all locale codes that have a messages file on disk. */
export function getExistingLocales(): string[] {
  if (!existsSync(MESSAGES_DIR)) return [];
  const { readdirSync } = require("fs") as typeof import("fs");
  return readdirSync(MESSAGES_DIR)
    .filter((f: string) => f.endsWith(".json"))
    .map((f: string) => f.replace(/\.json$/, ""));
}
