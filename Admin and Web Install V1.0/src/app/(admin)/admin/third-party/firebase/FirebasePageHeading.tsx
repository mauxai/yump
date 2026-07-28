"use client";
import { useT } from "@/lib/i18n";

export function FirebasePageHeading() {
  const { t } = useT();
  return (
    <div className="mb-6">
      <h1 className="text-[18px] font-bold text-fg-0">{t("adminFirebase.title")}</h1>
      <p className="text-[13px] text-fg-3 mt-1">{t("adminFirebase.subtitle")}</p>
    </div>
  );
}
