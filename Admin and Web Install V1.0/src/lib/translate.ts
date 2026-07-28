import { translate } from "@vitalets/google-translate-api";

export type TranslateResult = { ok: true; text: string } | { ok: false; error: string };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Translate a string from English to the target language using the free
 * Google Translate unofficial API — no API key required.
 *
 * Retries up to 3 times with exponential backoff on 429 / rate-limit errors.
 */
export async function translateText(
  text: string,
  _targetLangName: string,
  targetCode: string,
): Promise<TranslateResult> {
  if (!text.trim()) return { ok: true, text: "" };

  const MAX_RETRIES = 3;
  const BASE_DELAY  = 1500; // ms — doubles on each retry

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const { text: translated } = await translate(text, { from: "en", to: targetCode });
      return { ok: true, text: translated };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const isTooManyRequests =
        message.toLowerCase().includes("too many requests") ||
        message.includes("429");

      // On last attempt or non-rate-limit error → give up
      if (!isTooManyRequests || attempt === MAX_RETRIES) {
        return { ok: false, error: `Translation failed: ${message}` };
      }

      // Rate-limited: wait then retry
      const delay = BASE_DELAY * Math.pow(2, attempt); // 1.5s, 3s, 6s
      await sleep(delay);
    }
  }

  return { ok: false, error: "Translation failed after retries." };
}
