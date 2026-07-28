"use client";
import Link from "next/link";
import { useT } from "@/lib/i18n";

export function ResetPasswordForm() {
  const { t } = useT();

  return (
    <div className="text-center">
      <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </div>
      <div className="text-[20px] font-semibold tracking-tight mb-2">{t("auth.resetPasswordTitle")}</div>
      <p className="text-[13px] text-fg-2 mb-6">{t("auth.resetPasswordHint")}</p>
      <Link href="/forgot-password" className="text-accent text-[13px] font-medium hover:underline">
        {t("auth.goToForgotPassword")}
      </Link>
    </div>
  );
}
