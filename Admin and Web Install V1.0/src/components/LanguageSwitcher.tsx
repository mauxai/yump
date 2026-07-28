"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { useT } from "@/lib/i18n";

export type LangOption = {
  code: string;
  name: string;
  nativeName: string;
  isDefault: boolean;
  direction: "ltr" | "rtl";
};

export function LanguageSwitcher({ languages }: { languages: LangOption[] }) {
  const { lang: currentLang, switching, switchLang } = useT();
  // Initialise directly from the server-resolved lang (cookie-based) so there is
  // no flash between the first render and the localStorage useEffect.
  const [activeCode, setActiveCode] = useState<string>(currentLang);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const defaultCode =
    languages.find((l) => l.isDefault)?.code ?? languages[0]?.code ?? "";

  useEffect(() => {
    const saved = localStorage.getItem("app-lang");
    const valid = saved && languages.some((l) => l.code === saved);
    const resolved = valid ? saved! : defaultCode;
    if (resolved !== activeCode) setActiveCode(resolved);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultCode, languages]);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function choose(lang: LangOption) {
    setActiveCode(lang.code);
    switchLang(lang.code, lang.direction);
    setOpen(false);
  }

  const active = languages.find((l) => l.code === activeCode) ?? languages[0];
  if (!active || languages.length < 2) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => !switching && setOpen((v) => !v)}
        disabled={switching}
        title="Switch language"
        className="inline-flex items-center gap-1 h-9 px-2.5 rounded-[8px] text-[12px] font-medium text-fg-2 hover:text-fg-0 hover:bg-bg-2 transition-colors disabled:opacity-60"
      >
        {switching ? (
          <svg className="hidden sm:block animate-spin" width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        ) : (
          <Icon name="globe" size={13} className="hidden sm:block" />
        )}
        <span className="mono uppercase">{active.code}</span>
        <Icon name="arrowRight" size={10} className="rotate-90" />
      </button>

      {open && (
        <div
          className="absolute end-0 top-[calc(100%+6px)] z-50 min-w-[180px] bg-bg-1 border border-line-2 rounded-[10px] p-1 shadow-lg"
        >
          <div className="px-3 py-1.5 mb-1 border-b border-line">
            <span className="text-[10px] font-semibold text-fg-3 uppercase tracking-[0.6px]">
              Language
            </span>
          </div>
          {languages.map((l) => (
            <button
              key={l.code}
              dir="ltr"
              type="button"
              onClick={() => choose(l)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded text-left transition-colors hover:bg-bg-2 ${
                l.code === activeCode ? "text-fg-0" : "text-fg-1"
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className={`text-[13px] truncate ${l.code === activeCode ? "font-medium" : ""}`}>
                  {l.nativeName}
                </div>
                <div className="text-[11px] text-fg-3 mono">{l.code}</div>
              </div>
              {l.isDefault && (
                <span className="text-[9px] px-1 py-0.5 rounded bg-bg-2 border border-line-2 text-fg-3 mono uppercase shrink-0">
                  default
                </span>
              )}
              {l.code === activeCode && (
                <Icon name="arrowRight" size={11} className="text-accent shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
