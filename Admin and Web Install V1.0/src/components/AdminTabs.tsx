"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./Icon";

const TABS: { href: string; label: string; icon: IconName }[] = [
  { href: "/admin", label: "Metrics", icon: "home" },
  { href: "/admin/users", label: "Users", icon: "user" },
  { href: "/admin/projects", label: "Projects", icon: "folder" },
  { href: "/admin/audit", label: "Audit log", icon: "history" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
];

export function AdminTabs() {
  const pathname = usePathname();
  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(href + "/");
  }
  return (
    <div className="flex items-center gap-1 px-8 border-b border-line">
      {TABS.map((t) => {
        const active = isActive(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`inline-flex items-center gap-2 h-10 px-3 text-[13px] border-b-2 -mb-px transition-colors ${
              active
                ? "border-accent text-fg-0 font-medium"
                : "border-transparent text-fg-2 hover:text-fg-0"
            }`}
          >
            <Icon name={t.icon} size={14} />
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
