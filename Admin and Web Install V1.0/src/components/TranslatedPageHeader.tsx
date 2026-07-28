"use client";
import { useT } from "@/lib/i18n";

export function TranslatedPageHeader({
  title,
  titleKey,
  subtitle,
  subtitleKey,
}: {
  title: string;
  titleKey?: string;
  subtitle?: string;
  subtitleKey?: string;
}) {
  const { t } = useT();

  const heading  = titleKey    ? t(titleKey)    : title;
  const subtext  = subtitleKey ? t(subtitleKey) : subtitle;

  return (
    <div>
      <div className="text-[15px] font-semibold tracking-tight text-fg-0 leading-tight">{heading}</div>
      {subtext && <div className="text-[12px] text-fg-3 mt-0.5">{subtext}</div>}
    </div>
  );
}
