"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Icon } from "@/components/Icon";
import { useT } from "@/lib/i18n";

export default function VerifyEmailPage() {
  const { t } = useT();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-0 px-4">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
          <Icon name="mail" size={28} className="text-accent" />
        </div>
        <div>
          <h1 className="text-[22px] font-bold text-fg-0">{t("auth.verifyEmailTitle")}</h1>
          <p className="text-[13px] text-fg-3 mt-2 leading-relaxed">
            {email
              ? t("auth.verifyEmailHint", { email })
              : t("auth.verifyEmailHintNoEmail")}
          </p>
        </div>
        <div className="rounded-xl border border-line bg-bg-1 p-5 text-left space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-bg-3 flex items-center justify-center text-[11px] font-bold text-fg-2 shrink-0 mt-0.5">1</div>
            <p className="text-[12px] text-fg-2">{t("auth.verifyStep1")}</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-bg-3 flex items-center justify-center text-[11px] font-bold text-fg-2 shrink-0 mt-0.5">2</div>
            <p className="text-[12px] text-fg-2">{t("auth.verifyStep2")}</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-bg-3 flex items-center justify-center text-[11px] font-bold text-fg-2 shrink-0 mt-0.5">3</div>
            <p className="text-[12px] text-fg-2">{t("auth.verifyStep3")}</p>
          </div>
        </div>
        <p className="text-[12px] text-fg-3">
          {t("auth.didntReceiveIt")}{" "}
          <button className="text-accent hover:underline">{t("auth.resendEmail")}</button>
        </p>
        <Link
          href="/login"
          className="text-[12px] text-fg-3 hover:text-fg-0 flex items-center justify-center gap-1"
        >
          <Icon name="arrowLeft" size={12} />
          {t("auth.backToSignIn")}
        </Link>
      </div>
    </div>
  );
}
