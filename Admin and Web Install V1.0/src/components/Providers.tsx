"use client";
import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { ToastProvider } from "@/components/Toast";
import { TranslationProvider, type Messages } from "@/lib/i18n";

export function Providers({
  children,
  initialLang,
  initialDir,
  initialMessages,
}: {
  children: ReactNode;
  initialLang?: string;
  initialDir?: string;
  initialMessages?: Messages;
}) {
  return (
    <SessionProvider>
      <TranslationProvider initialLang={initialLang} initialDir={initialDir} initialMessages={initialMessages}>
        <ToastProvider>{children}</ToastProvider>
      </TranslationProvider>
    </SessionProvider>
  );
}
