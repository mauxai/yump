"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
// English messages bundled as the immediate fallback (no flash on first render)
import enMessages from "../../messages/en.json";

export type Messages = Record<string, Record<string, string>>;

const LANG_KEY = "app-lang";
const DIR_KEY  = "app-lang-dir";

// Module-level cache: survives React re-renders and soft navigations.
// Populated from server props on first load, then from fetchMessages on switch.
const _msgCache: Record<string, Messages> = {};

interface LangState {
  lang: string;
  messages: Messages;
}

interface TranslationCtx {
  t: (key: string, params?: Record<string, string | number>) => string;
  lang: string;
  switching: boolean;
  switchLang: (code: string, direction: string) => void;
}

const Ctx = createContext<TranslationCtx>({
  t: (key) => key.split(".").pop() ?? key,
  lang: "en",
  switching: false,
  switchLang: () => {},
});

async function fetchMessages(lang: string): Promise<Messages> {
  try {
    const res = await fetch(`/api/messages/${lang}`);
    if (!res.ok) return {};
    return res.json();
  } catch {
    return {};
  }
}

export function TranslationProvider({
  children,
  initialLang = "en",
  initialDir = "ltr",
  initialMessages = {},
}: {
  children: ReactNode;
  initialLang?: string;
  initialDir?: string;
  initialMessages?: Messages;
}) {
  // Seed module cache from server-provided messages (only on first SSR load).
  if (initialLang !== "en" && initialMessages && Object.keys(initialMessages).length > 0) {
    _msgCache[initialLang] = initialMessages as Messages;
  }

  // lang + messages in ONE state object — a single setState call guarantees
  // they are never out of sync, which is what caused the blink.
  // Prefer module cache (instant, no network) over the server prop which may
  // be empty on RSC navigation requests.
  const [{ lang, messages }, setLangState] = useState<LangState>({
    lang: initialLang,
    messages: initialLang !== "en" ? (_msgCache[initialLang] ?? initialMessages) : {},
  });
  const [switching, setSwitching] = useState(false);
  const fallback = enMessages as unknown as Messages;

  // Sync localStorage on mount; preserve the server-rendered dir on first visit
  useEffect(() => {
    const storedLang = localStorage.getItem(LANG_KEY);
    const storedDir  = localStorage.getItem(DIR_KEY);
    if (!storedLang || storedLang !== initialLang) {
      localStorage.setItem(LANG_KEY, initialLang);
    }
    if (storedDir) {
      applyDir(storedDir);
    } else {
      localStorage.setItem(DIR_KEY, initialDir);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const switchLang = useCallback((code: string, direction: string) => {
    localStorage.setItem(LANG_KEY, code);
    localStorage.setItem(DIR_KEY, direction);
    document.cookie = `app-lang=${code}; path=/; max-age=31536000; SameSite=Lax`;
    applyDir(direction);
    if (code === "en") {
      // Synchronous single setState — zero chance of intermediate render
      setLangState({ lang: "en", messages: {} });
    } else {
      // Check module cache first — instant if already fetched this session
      if (_msgCache[code]) {
        setLangState({ lang: code, messages: _msgCache[code] });
        return;
      }
      setSwitching(true);
      fetchMessages(code).then((msgs) => {
        _msgCache[code] = msgs;
        // Single setState: lang and messages update in exactly one render
        setLangState({ lang: code, messages: msgs });
        setSwitching(false);
      });
    }
  }, []);

  // Keep <html lang="…"> in sync
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const dotIdx = key.indexOf(".");
      if (dotIdx === -1) return key;
      const section = key.slice(0, dotIdx);
      const subkey  = key.slice(dotIdx + 1);

      const raw =
        (lang !== "en" && (messages[section] as Record<string, string> | undefined)?.[subkey]) ||
        (fallback[section] as Record<string, string> | undefined)?.[subkey] ||
        subkey;

      if (!params) return raw;

      let text = raw;
      for (const [k, v] of Object.entries(params)) {
        text = text.replaceAll(`{${k}}`, String(v));
      }
      return text;
    },
    [lang, messages, fallback],
  );

  const ctxValue = useMemo(
    () => ({ t, lang, switching, switchLang }),
    [t, lang, switching, switchLang],
  );
  return <Ctx.Provider value={ctxValue}>{children}</Ctx.Provider>;
}

export function useT() {
  return useContext(Ctx);
}

function applyDir(dir: string) {
  document.documentElement.dir = dir === "rtl" ? "rtl" : "ltr";
}
