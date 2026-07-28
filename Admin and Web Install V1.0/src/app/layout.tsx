import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { theme, buildCssVars } from "@/config/theme";
import { getSettingsMap } from "@/lib/settings";
import { loadMessages } from "@/lib/load-messages";
import { getActiveLanguages } from "@/lib/get-active-languages";

// Every page depends on runtime DB state (branding, settings, languages), so
// nothing can be baked at build time — declaring it here stops `next build`
// from even attempting to prerender pages (attempts whose DB queries fail
// loudly on a freshly unpacked copy with no DATABASE_URL yet).
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  // Tolerate a missing/unconfigured database — pre-install the root layout
  // must still render so the /install wizard can run.
  const s = await getSettingsMap().catch(() => ({}) as Record<string, string>);
  const name = s["brand.name"] || "6amStudio";
  const slogan = s["brand.slogan"] || "AI-powered photo editing";
  const favicon = s["brand.favicon"] || "";
  return {
    title: `${name} — ${slogan}`,
    description: slogan,
    icons: favicon ? { icon: favicon } : undefined,
  };
}

const shadowDark  = "0 1px 0 rgba(255,255,255,0.04) inset,0 10px 30px rgba(0,0,0,0.5)";
const shadowLight = "0 1px 0 rgba(255,255,255,0.6) inset,0 6px 20px rgba(0,0,0,0.06)";

const themeInitScript = `(function(){try{var s=localStorage.getItem('theme');var d=s?s==='dark':false;document.documentElement.dataset.theme=d?'dark':'light';}catch(e){}})();`;
const dirInitScript = `(function(){try{var d=localStorage.getItem('app-lang-dir');if(d==='rtl'){document.documentElement.dir='rtl';}}catch(e){}})();`;

function getContrastFg(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16) || 0;
  const g = parseInt(h.substring(2, 4), 16) || 0;
  const b = parseInt(h.substring(4, 6), 16) || 0;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? "#0a0b0d" : "#ffffff";
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [cookieStore, headersList] = await Promise.all([cookies(), headers()]);
  const cookieLang = cookieStore.get("app-lang")?.value;

  // RSC navigation requests have the "rsc" header set to "1".
  // On these requests the client already holds messages in React state,
  // so skip the heavy JSON serialization to keep the RSC payload small.
  const isRscNav = headersList.get("rsc") === "1";

  // DB lookups fall back to defaults when the database isn't reachable yet
  // (fresh deployment before the /install wizard has run).
  const [s, languages, initialMessages0] = await Promise.all([
    getSettingsMap().catch(() => ({}) as Record<string, string>),
    getActiveLanguages().catch(() => []),
    (!isRscNav && cookieLang) ? loadMessages(cookieLang).catch(() => null) : Promise.resolve(null),
  ]);

  // If no cookie yet, fall back to the DB default language
  const defaultLang = languages.find((l) => l.isDefault) ?? languages[0];
  const langCode = cookieLang ?? defaultLang?.code ?? "en";
  const langDir  = languages.find((l) => l.code === langCode)?.direction ?? "ltr";
  const initialMessages = isRscNav ? {} : (initialMessages0 ?? (langCode !== "en" ? await loadMessages(langCode) : {}));
  const darkPrimary  = s["brand.primaryDark"]  || theme.dark.primary;
  const lightPrimary = s["brand.primaryLight"] || theme.light.primary;

  const darkTheme  = { ...theme.dark,  primary: darkPrimary,  primaryFg: getContrastFg(darkPrimary) };
  const lightTheme = { ...theme.light, primary: lightPrimary, primaryFg: getContrastFg(lightPrimary) };

  const css = [
    `:root{${buildCssVars(darkTheme)};--shadow:${shadowDark}}`,
    `:root[data-theme="light"]{${buildCssVars(lightTheme)};--shadow:${shadowLight}}`,
  ].join("");

  return (
    <html lang={langCode} dir={langDir} data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script dangerouslySetInnerHTML={{ __html: dirInitScript }} />
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers initialLang={langCode} initialDir={langDir} initialMessages={initialMessages}>{children}</Providers>
      </body>
    </html>
  );
}
