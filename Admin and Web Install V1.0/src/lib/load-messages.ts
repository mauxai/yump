import type { Messages } from "./i18n";

const cache: Record<string, Messages> = {};

export async function loadMessages(lang: string): Promise<Messages> {
  if (lang === "en") return {};
  if (cache[lang]) return cache[lang];
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require(`../../messages/${lang}.json`) as Messages;
    cache[lang] = mod;
    return mod;
  } catch {
    return {};
  }
}
