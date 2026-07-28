import type { ReactNode } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { getSettingsMap } from "@/lib/settings";
import { getActiveLanguages } from "@/lib/get-active-languages";
import { publicEnv } from "@/config/env";
import { AuthShowcase, AuthTaglineClient } from "./AuthShowcase";

type Brand = { name: string; logo: string; slogan: string };

function Brand({ brand }: { brand: Brand }) {
  const initial = brand.name.charAt(0).toUpperCase() || "?";
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent via-accent/90 to-accent/70 flex items-center justify-center text-[var(--accent-fg)] font-extrabold text-[16px] shadow-lg shadow-accent/25 overflow-hidden ring-1 ring-white/20">
        {brand.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={brand.logo} alt={brand.name} className="w-full h-full object-cover" />
        ) : (
          initial
        )}
      </div>
      <div>
        <div className="font-extrabold tracking-tight text-[17px] leading-snug text-fg-0">{brand.name}</div>
        <div className="text-[11px] font-semibold text-fg-3 uppercase tracking-wider">AI Creative Studio</div>
      </div>
    </div>
  );
}

export async function AuthShell({ children }: { children: ReactNode }) {
  const [s, languages] = await Promise.all([
    getSettingsMap(),
    getActiveLanguages(),
  ]);

  const brand: Brand = {
    name: s["brand.name"] || "6amStudio",
    logo: s["brand.logo"] || "",
    slogan: s["brand.slogan"] || "",
  };

  return (
    <div className="min-h-screen md:h-screen grid grid-cols-1 md:grid-cols-2 bg-bg-0">
      {/* Left brand & feature panel — desktop only */}
      <div className="relative overflow-hidden bg-bg-1 border-r border-line flex-col p-10 lg:p-12 hidden md:flex justify-between">
        {/* Decorative glowing gradient backdrop shapes */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-accent/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
        
        {/* Top Header */}
        <div className="relative z-10 flex items-center justify-between">
          <Brand brand={brand} />
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-accent/10 text-accent border border-accent/20">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            v{publicEnv.APP_VERSION}
          </span>
        </div>

        {/* Middle Feature Showcase */}
        <div className="relative z-10 my-auto py-6 flex justify-center">
          <AuthShowcase brand={brand} />
        </div>

        {/* Bottom Tagline */}
        <div className="relative z-10 flex items-center justify-between text-[12px] text-fg-3 border-t border-line/50 pt-4">
          <span>&copy; {new Date().getFullYear()} {brand.name}</span>
          <div className="mono">
            <AuthTaglineClient />
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-col p-8 md:p-12">
        {/* Mobile-only top bar */}
        <div className="flex items-center justify-between md:hidden mb-8">
          <Brand brand={brand} />
          <div className="flex items-center gap-1">
            <LanguageSwitcher languages={languages} />
            <ThemeToggle />
          </div>
        </div>
        {/* Desktop top-right controls */}
        <div className="hidden md:flex items-center justify-end gap-1 mb-6">
          <LanguageSwitcher languages={languages} />
          <ThemeToggle />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-[360px]">{children}</div>
        </div>
      </div>
    </div>
  );
}

