"use client";
import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { Icon, type IconName } from "./Icon";
import { AdminSearchButton } from "./AdminSearch";
import { useT } from "@/lib/i18n";

type Actor = { name: string; email: string; avatar?: string | null };
type LangOption = { code: string; name: string; nativeName: string; isDefault: boolean; direction: "ltr" | "rtl" };

export function AdminTopBar({ actor, languages = [] }: { actor: Actor; languages?: LangOption[] }) {
  return (
    <header className="flex items-center gap-2 h-14 px-3 sm:px-6 border-b border-line bg-bg-1 shrink-0">
      {/* Hamburger — mobile only */}
      <button
        type="button"
        className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-[8px] text-fg-2 hover:bg-bg-2 transition-colors shrink-0"
        onClick={() => window.dispatchEvent(new Event("sidebar:toggle"))}
        aria-label="Open menu"
      >
        <Icon name="menu" size={16} />
      </button>

      <div className="flex-1 flex justify-center">
        <AdminSearchButton />
      </div>

      <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
        {languages.length > 0 && <LanguageMenu languages={languages} />}
        <ThemeToggle />
        <div className="w-px h-5 bg-line mx-1" />
        <UserMenu actor={actor} />
      </div>
    </header>
  );
}

function IconButton({
  icon,
  title,
  onClick,
  badge,
}: {
  icon: IconName;
  title: string;
  onClick?: () => void;
  badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="relative inline-flex items-center justify-center w-9 h-9 rounded-[8px] text-fg-2 hover:text-fg-0 hover:bg-bg-2 transition-colors"
    >
      <Icon name={icon} size={15} />
      {badge != null && badge > 0 && (
        <span className="absolute top-1.5 right-1.5 min-w-[14px] h-[14px] px-1 rounded-full bg-accent text-[var(--accent-fg)] text-[9px] font-semibold flex items-center justify-center">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </button>
  );
}

function useClickOutside(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [onClose]);
  return ref;
}

function LanguageMenu({ languages }: { languages: LangOption[] }) {
  const { lang: currentLang, switchLang } = useT();
  const [open, setOpen] = useState(false);
  const [activeCode, setActiveCode] = useState<string>(currentLang);
  const ref = useClickOutside(() => setOpen(false));

  const defaultCode = languages.find((l) => l.isDefault)?.code ?? languages[0]?.code ?? "";

  useEffect(() => {
    const saved = localStorage.getItem("app-lang");
    const valid = saved && languages.some((l) => l.code === saved);
    const resolved = valid ? saved! : defaultCode;
    if (resolved !== activeCode) setActiveCode(resolved);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultCode, languages]);

  function choose(lang: LangOption) {
    setActiveCode(lang.code);
    switchLang(lang.code, lang.direction);
    setOpen(false);
  }

  const active = languages.find((l) => l.code === activeCode) ?? languages[0];
  if (!active) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Switch language"
        className="inline-flex items-center gap-1 h-9 px-2.5 rounded-[8px] text-[12px] font-medium text-fg-2 hover:text-fg-0 hover:bg-bg-2 transition-colors"
      >
        <Icon name="globe" size={13} className="hidden sm:block" />
        <span className="mono uppercase">{active.code}</span>
        <Icon name="arrowRight" size={10} className="rotate-90" />
      </button>
      {open && (
        <div className="absolute end-0 top-[calc(100%+6px)] z-50 min-w-[180px] bg-bg-1 border border-line-2 rounded-[10px] p-1 shadow-lg">
          <div className="px-3 py-1.5 mb-1 border-b border-line">
            <span className="text-[10px] font-semibold text-fg-3 uppercase tracking-[0.6px]">
              Language
            </span>
          </div>
          {languages.map((l) => (
            <button
              key={l.code}
              dir="ltr"
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


function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light" | null>(null);

  useEffect(() => {
    const current =
      (document.documentElement.dataset.theme as "dark" | "light") || "dark";
    setTheme(current);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem("theme", next);
  }

  if (theme === null) {
    return <div className="w-9 h-9" />;
  }

  return (
    <IconButton
      icon={theme === "dark" ? "sun" : "moon"}
      title={theme === "dark" ? "Switch to light" : "Switch to dark"}
      onClick={toggle}
    />
  );
}

function UserMenu({ actor }: { actor: Actor }) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false));
  const initial = actor.name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 h-9 pl-1 pr-2.5 rounded-[8px] hover:bg-bg-2 transition-colors"
      >
        <div className="w-7 h-7 rounded-[7px] bg-bg-3 border border-line-2 flex items-center justify-center text-[11px] font-semibold text-fg-0 overflow-hidden shrink-0">
          {actor.avatar
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={actor.avatar} alt="" className="w-full h-full object-cover" />
            : initial}
        </div>
        <span className="hidden sm:block text-[12px] font-medium text-fg-0 max-w-[120px] truncate">
          {actor.name}
        </span>
        <Icon name="arrowRight" size={10} className="rotate-90 text-fg-3" />
      </button>
      {open && (
        <div className="absolute end-0 top-[calc(100%+6px)] z-50 min-w-[220px] bg-bg-1 border border-line-2 rounded-[10px] p-1 shadow-lg">
          {/* Identity strip */}
          <div dir="ltr" className="flex items-center gap-3 px-3 py-2.5 border-b border-line mb-1">
            <div className="w-8 h-8 rounded-full bg-bg-3 border border-line-2 flex items-center justify-center text-[12px] font-semibold text-fg-0 overflow-hidden shrink-0">
              {actor.avatar
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={actor.avatar} alt="" className="w-full h-full object-cover" />
                : initial}
            </div>
            <div className="min-w-0">
              <div className="text-[12px] font-semibold text-fg-0 truncate">{actor.name}</div>
              <div className="text-[11px] text-fg-2 truncate">{actor.email}</div>
            </div>
          </div>
          {/* Profile link */}
          <a
            href="/admin/profile"
            dir="ltr"
            onClick={() => setOpen(false)}
            className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-fg-0 hover:bg-bg-2 rounded text-left"
          >
            <Icon name="user" size={13} className="text-fg-2" />
            My profile
          </a>
          <div className="my-1 border-t border-line" />
          <button
            dir="ltr"
            onClick={() => { setOpen(false); signOut({ callbackUrl: "/admin/login" }); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-fg-0 hover:bg-bg-2 rounded text-left"
          >
            <Icon name="logout" size={13} className="text-fg-2" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
