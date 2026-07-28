"use client";
import Link from "next/link";
import { Icon, type IconName } from "@/components/Icon";
import { useT } from "@/lib/i18n";

export function SettingsTabs({ active }: { active: string }) {
  const { t } = useT();
  const TABS: { id: string; label: string; icon: IconName }[] = [
    { id: "general", label: t("adminSettings.tabGeneral"), icon: "settings" },
    { id: "storage", label: t("adminSettings.tabStorage"), icon: "folder" },
  ];
  return (
    <div className="flex items-center gap-1 border-b border-line">
      {TABS.map((t) => {
        const isActive = t.id === active;
        const href = t.id === "general" ? "/admin/settings" : `/admin/settings?tab=${t.id}`;
        return (
          <Link
            key={t.id}
            href={href}
            className={`inline-flex items-center gap-2 h-9 px-3 text-[13px] border-b-2 -mb-px transition-colors ${
              isActive
                ? "border-accent text-fg-0 font-medium"
                : "border-transparent text-fg-2 hover:text-fg-0"
            }`}
          >
            <Icon name={t.icon} size={13} />
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
