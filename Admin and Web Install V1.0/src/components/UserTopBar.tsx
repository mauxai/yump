"use client";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher, type LangOption } from "./LanguageSwitcher";
import { Icon } from "./Icon";
import { useT } from "@/lib/i18n";

type UserInfo = {
  name: string;
  email: string;
  avatar?: string | null;
};

export function UserTopBar({
  left,
  center,
  right,
  user,
  languages = [],
}: {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
  user?: UserInfo;
  languages?: LangOption[];
}) {
  return (
    <header className="flex items-center gap-2 md:gap-4 h-14 px-3 md:px-6 border-b border-line bg-bg-1 shrink-0">
      {/* Hamburger — visible below lg (sidebar hidden below lg) */}
      <button
        className="lg:hidden flex items-center justify-center w-8 h-8 rounded-[6px] text-fg-2 hover:bg-bg-2 transition-colors shrink-0"
        onClick={() => window.dispatchEvent(new CustomEvent("sidebar:toggle"))}
        aria-label="Open menu"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      {/* Left slot */}
      <div className="flex-1 min-w-0 lg:w-[280px] lg:flex-none">{left}</div>

      {/* Center slot */}
      {center && (
        <div className="flex-1 flex justify-center">
          {center}
        </div>
      )}

      {/* Right slot + language + theme + profile */}
      <div className="flex items-center gap-1 ms-auto shrink-0">
        {right}
        <LanguageSwitcher languages={languages} />
        <ThemeToggle />
        {user && (
          <>
            <div className="w-px h-5 bg-line mx-1" />
            <ProfileMenu user={user} />
          </>
        )}
      </div>
    </header>
  );
}

function ProfileMenu({ user }: { user: UserInfo }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const initial = (user.name.trim().charAt(0) || "?").toUpperCase();

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("mousedown", handle);
    return () => window.removeEventListener("mousedown", handle);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 h-9 pl-1 pr-3 rounded-[8px] hover:bg-bg-2 transition-colors"
      >
        {/* Avatar */}
        <div className="w-7 h-7 rounded-full bg-accent/15 border border-accent/20 flex items-center justify-center overflow-hidden shrink-0">
          {user.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[12px] font-semibold text-accent">{initial}</span>
          )}
        </div>
        {/* Name */}
        <div className="text-left hidden sm:block">
          <div className="text-[13px] font-medium text-fg-0 leading-tight max-w-[120px] truncate">{user.name}</div>
          <div className="text-[10px] text-fg-3 leading-tight max-w-[120px] truncate">{user.email}</div>
        </div>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-fg-3 ml-0.5"><polyline points="6 9 12 15 18 9"/></svg>
      </button>

      {open && (
        <div className="absolute end-0 top-[calc(100%+6px)] z-50 min-w-[200px] bg-bg-1 border border-line-2 rounded-[10px] shadow-lg p-1">
          {/* User info header */}
          <div dir="ltr" className="px-3 py-2.5 border-b border-line mb-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-accent/15 border border-accent/20 flex items-center justify-center overflow-hidden shrink-0">
                {user.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[13px] font-semibold text-accent">{initial}</span>
                )}
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-fg-0 truncate">{user.name}</div>
                <div className="text-[11px] text-fg-3 truncate">{user.email}</div>
              </div>
            </div>
          </div>

          <button
            dir="ltr"
            onClick={() => { setOpen(false); router.push("/settings"); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-[6px] text-[13px] text-fg-0 hover:bg-bg-2 transition-colors text-left"
          >
            <Icon name="settings" size={13} className="text-fg-3" />
            {t("nav.settings")}
          </button>
          <button
            dir="ltr"
            onClick={() => { setOpen(false); router.push("/billing"); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-[6px] text-[13px] text-fg-0 hover:bg-bg-2 transition-colors text-left"
          >
            <Icon name="credit" size={13} className="text-fg-3" />
            {t("nav.billing")}
          </button>

          <div className="my-1 border-t border-line" />

          <button
            dir="ltr"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-[6px] text-[13px] text-fg-0 hover:bg-bg-2 transition-colors text-left"
          >
            <Icon name="logout" size={13} className="text-fg-3" />
            {t("nav.signOut")}
          </button>
        </div>
      )}
    </div>
  );
}
