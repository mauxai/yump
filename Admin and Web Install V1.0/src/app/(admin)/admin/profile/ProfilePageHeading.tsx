"use client";
import { useT } from "@/lib/i18n";

export function ProfilePageHeading() {
  const { t } = useT();
  return (
    <div className="mb-6 sm:mb-8">
      <div className="text-[11px] text-fg-3 uppercase tracking-[0.7px] font-medium mono mb-1">
        {t("adminProfile.breadcrumb")}
      </div>
      <h1 className="text-[22px] sm:text-[26px] font-semibold tracking-tight text-fg-0">
        {t("adminProfile.title")}
      </h1>
      <p className="text-[13px] text-fg-2 mt-1">
        {t("adminProfile.subtitle")}
      </p>
    </div>
  );
}
