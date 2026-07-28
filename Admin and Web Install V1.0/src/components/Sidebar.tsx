"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { Icon, type IconName } from "./Icon";
import { CreditsRing, Badge } from "./ui";
import { useT } from "@/lib/i18n";

type NavItem = {
  key: string;
  icon: IconName;
  label: string;
  labelKey?: string;
  href?: string; // if omitted → "Soon"
};

type NavGroup = {
  key: string;
  icon: IconName;
  label: string;
  labelKey?: string;
  children: NavItem[];
};

const USER_ITEMS: NavItem[] = [
  { key: "home",          icon: "home",     labelKey: "nav.home",          label: "Home",              href: "/" },
  { key: "activity",      icon: "history",  labelKey: "nav.activity",      label: "Activity",          href: "/activity" },
  { key: "notifications", icon: "bell",     labelKey: "nav.notifications", label: "Notifications",     href: "/notifications" },
  { key: "billing",       icon: "credit",   labelKey: "nav.billing",       label: "Credits & billing", href: "/billing" },
  { key: "settings",      icon: "settings", labelKey: "nav.settings",      label: "Settings",          href: "/settings" },
];

type NavSection = {
  label: string;
  labelKey?: string;
  items: NavItem[];
  groups?: NavGroup[];
};

const ADMIN_SECTIONS: NavSection[] = [
  {
    label: "Overview", labelKey: "adminNav.overview",
    items: [
      { key: "admin", icon: "bolt", label: "Admin portal", labelKey: "adminNav.adminPortal", href: "/admin" },
    ],
  },
  {
    label: "User Management", labelKey: "adminNav.userManagement",
    items: [
      { key: "admin-users",  icon: "user",    label: "Users",     labelKey: "adminNav.users",    href: "/admin/users" },
      { key: "admin-audit",  icon: "history", label: "Audit log", labelKey: "adminNav.auditLog", href: "/admin/audit" },
    ],
  },
  {
    label: "Content & AI", labelKey: "adminNav.contentAi",
    items: [
      { key: "admin-models",    icon: "cpu",      label: "AI Models",  labelKey: "adminNav.aiModels",   href: "/admin/models" },
      { key: "admin-prompts",   icon: "wand",     label: "Suggestion", labelKey: "adminNav.prompts",    href: "/admin/prompts" },
      { key: "admin-effects",   icon: "sparkles", label: "Effects",    labelKey: "adminNav.effects",    href: "/admin/effects" },
      { key: "admin-templates", icon: "image",    label: "Templates",  labelKey: "adminNav.templates",  href: "/admin/templates" },
      { key: "admin-branding",  icon: "palette",  label: "Branding",   labelKey: "adminNav.branding",   href: "/admin/branding" },
    ],
  },
  {
    label: "Billing", labelKey: "adminNav.billing",
    items: [
      { key: "admin-plans",        icon: "credit",  label: "Plans",        labelKey: "adminNav.plans",        href: "/admin/plans" },
      { key: "admin-transactions", icon: "history", label: "Transactions", labelKey: "adminNav.transactions", href: "/admin/transactions" },
      { key: "admin-business",     icon: "sliders", label: "Business",     labelKey: "adminNav.business",     href: "/admin/business" },
    ],
  },
  {
    label: "System", labelKey: "adminNav.system",
    items: [
      { key: "admin-languages", icon: "globe",    label: "Languages", labelKey: "adminNav.languages", href: "/admin/languages" },
      { key: "admin-settings",  icon: "settings", label: "Settings",  labelKey: "adminNav.settings",  href: "/admin/settings" },
    ],
  },
  {
    label: "Integrations", labelKey: "adminNav.integrations",
    items: [
      { key: "admin-smtp",           icon: "mail", label: "SMTP",           labelKey: "adminNav.smtp",          href: "/admin/smtp" },
      { key: "admin-mail-templates", icon: "mail", label: "Mail Templates", labelKey: "adminNav.mailTemplates", href: "/admin/mail-templates" },
    ],
    groups: [
      {
        key: "third-party", icon: "layers", label: "3rd Party", labelKey: "adminNav.thirdParty",
        children: [
          { key: "third-party-payment",  icon: "credit",  label: "Gateway",  labelKey: "adminNav.gateway",  href: "/admin/third-party/payment" },
          { key: "third-party-oauth",    icon: "bolt",    label: "OAuth",    labelKey: "adminNav.oauth",    href: "/admin/third-party/oauth" },
          { key: "third-party-firebase", icon: "bell",    label: "Firebase", labelKey: "adminNav.firebase", href: "/admin/third-party/firebase" },
        ],
      },
    ],
  },
];

const COLLAPSED_KEY = "sidebar-collapsed";
const GROUP_OPEN_KEY = (key: string) => `sidebar-group-${key}`;

function isActive(pathname: string, item: NavItem): boolean {
  if (!item.href) return false;
  // Home / All projects both target "/" — highlight on exact match.
  if (item.href === "/") return pathname === "/";
  // Admin portal (/admin) — active only on exact /admin, not /admin/users etc.
  if (item.key === "admin") return pathname === "/admin";
  // Everything else: active on exact match or nested subroute.
  return pathname === item.href || pathname.startsWith(item.href + "/");
}

export function Sidebar({
  user,
  credits,
  role,
  brand,
}: {
  user: { name: string; email: string; avatar?: string | null };
  credits: { used: number; total: number };
  /** When "admin", show the "Admin portal" entry. */
  role?: "user" | "admin";
  brand: { name: string; logo: string; slogan?: string };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useT();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem(COLLAPSED_KEY) === "1");
  }, []);

  function toggleCollapsed() {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
      return next;
    });
  }

  const [mobileOpen, setMobileOpen] = useState(false);

  // Listen for hamburger toggle from TopBar
  useEffect(() => {
    function onToggle() { setMobileOpen((v) => !v); }
    window.addEventListener("sidebar:toggle", onToggle);
    return () => window.removeEventListener("sidebar:toggle", onToggle);
  }, []);

  // Close on route change (mobile)
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const initial = user.name.trim().charAt(0).toUpperCase() || "?";

  const sidebarContent = (isMobile = false) => (
    <>
      {/* Brand + collapse toggle */}
      <div className={`flex items-center gap-[10px] px-1 pt-[6px] pb-[18px] ${(!isMobile && collapsed) ? "justify-center" : ""}`}>
        <div className="w-7 h-7 rounded-[7px] bg-accent flex items-center justify-center text-[var(--accent-fg)] font-bold text-[13px] overflow-hidden shrink-0">
          {brand.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.logo} alt="" className="w-full h-full object-cover" />
          ) : (brand.name.trim().charAt(0).toUpperCase() || "?")}
        </div>
        {(isMobile || !collapsed) && (
          <>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[14px] text-fg-0 truncate leading-tight">{brand.name}</div>
              {brand.slogan && <div className="text-[11px] text-fg-2 truncate leading-tight mt-0.5">{brand.slogan}</div>}
            </div>
            {isMobile ? (
              <button onClick={() => setMobileOpen(false)} className="text-fg-2 hover:text-fg-0 p-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            ) : (
              <button onClick={toggleCollapsed} title="Collapse sidebar" className="text-fg-2 hover:text-fg-0 cursor-pointer shrink-0">
                <Icon name="arrowLeft" size={14} />
              </button>
            )}
          </>
        )}
      </div>

      {!isMobile && collapsed && (
        <button onClick={toggleCollapsed} title="Expand sidebar" className="self-center mb-3 p-1 rounded text-fg-2 hover:text-fg-0 hover:bg-bg-2">
          <Icon name="arrowRight" size={14} />
        </button>
      )}

      {/* Nav */}
      <nav className="flex flex-col overflow-y-auto flex-1">
        {role === "admin" ? (
          ADMIN_SECTIONS.map((section, i) => (
            <div key={section.label}>
              {i > 0 && (
                (!isMobile && collapsed)
                  ? <div className="my-2 mx-2 border-t border-line" />
                  : <div className="mx-[10px] mt-4 mb-1 flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-fg-4 uppercase tracking-[0.8px] whitespace-nowrap">{section.labelKey ? t(section.labelKey) : section.label}</span>
                      <div className="flex-1 h-px bg-line" />
                    </div>
              )}
              <div className="flex flex-col gap-[2px]">
                {section.items.map((it) => (
                  <NavItemRow key={it.key} item={it} pathname={pathname} collapsed={!isMobile && collapsed} />
                ))}
                {section.groups?.map((group) => (
                  <NavGroupItem key={group.key} group={group} pathname={pathname} collapsed={!isMobile && collapsed} />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col gap-[2px]">
            {USER_ITEMS.map((it) => (
              <NavItemRow key={it.key} item={it} pathname={pathname} collapsed={!isMobile && collapsed} />
            ))}
          </div>
        )}
      </nav>

      {/* Credits card */}
      {(isMobile || !collapsed) && role !== "admin" && (
        <div className="mt-5 p-3 bg-bg-2 border border-line rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] text-fg-2 uppercase tracking-[0.6px]">{t("sidebar.credits")}</div>
            <CreditsRing used={credits.used} total={credits.total} size={22} />
          </div>
          <div className="text-[20px] font-semibold tracking-tight mono">
            {credits.total - credits.used}<span className="text-fg-3 font-normal">/{credits.total}</span>
          </div>
          <button onClick={() => router.push("/billing")} className="mt-[10px] w-full h-7 rounded bg-transparent border border-line-2 text-fg-1 text-[12px] hover:bg-bg-3 transition-colors">
            {t("billing.upgrade")}
          </button>
        </div>
      )}

      {/* User row */}
      <div className={`mt-auto flex items-center gap-[10px] py-[10px] border-t border-line ${(!isMobile && collapsed) ? "justify-center px-0" : "px-2"}`}>
        <div className="w-[26px] h-[26px] rounded-[6px] bg-bg-3 border border-line-2 flex items-center justify-center text-[12px] font-semibold text-fg-0 shrink-0 overflow-hidden">
          {user.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatar} alt="" className="w-full h-full object-cover" />
          ) : initial}
        </div>
        {(isMobile || !collapsed) && (
          <>
            <div className="min-w-0 flex-1">
              <div className="text-[12px] font-medium text-fg-0 truncate">{user.name}</div>
              <div className="text-[11px] text-fg-2 truncate">{user.email}</div>
            </div>
            <UserMenu role={role} onSignOut={() => signOut({ callbackUrl: role === "admin" ? "/admin/login" : "/login" })} />
          </>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile overlay drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative z-10 w-[260px] bg-bg-1 flex flex-col p-[14px] h-full overflow-y-auto">
            {sidebarContent(true)}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        data-collapsed={collapsed ? "1" : undefined}
        className={`hidden lg:flex bg-bg-1 border-r border-line flex-col p-[14px] h-full transition-[width] duration-200 ease-out ${
          collapsed ? "w-[64px]" : "w-[232px]"
        }`}
      >
        {sidebarContent(false)}
      </aside>
    </>
  );
}

function NavItemRow({
  item,
  pathname,
  collapsed,
  indent = false,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
  indent?: boolean;
}) {
  const { t } = useT();
  const active = isActive(pathname, item);
  const disabled = !item.href;
  const label = item.labelKey ? t(item.labelKey) : item.label;
  const content = (
    <>
      <Icon name={item.icon} size={14} className={active ? "text-fg-0" : "text-fg-2"} />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{label}</span>
          {disabled && (
            <Badge tone="muted" className="!h-[18px] !text-[9px] !px-[6px]">{t("sidebar.soon")}</Badge>
          )}
        </>
      )}
    </>
  );
  const cls = `flex items-center gap-[10px] rounded-md text-[13px] text-left transition-colors ${
    collapsed ? "justify-center h-9 w-9 mx-auto" : `px-[10px] py-[7px] ${indent ? "pl-[28px]" : ""}`
  } ${
    active
      ? "bg-bg-3 text-fg-0 font-medium"
      : disabled
        ? "text-fg-3 cursor-not-allowed"
        : "text-fg-1 hover:bg-bg-2"
  }`;
  if (disabled) {
    return (
      <button className={cls} disabled title={collapsed ? label : undefined}>
        {content}
      </button>
    );
  }
  return (
    <Link href={item.href!} className={cls} title={collapsed ? label : undefined}>
      {content}
    </Link>
  );
}

function NavGroupItem({
  group,
  pathname,
  collapsed,
}: {
  group: NavGroup;
  pathname: string;
  collapsed: boolean;
}) {
  const { t } = useT();
  const hasActiveChild = group.children.some((c) => c.href && (pathname === c.href || pathname.startsWith(c.href + "/")));
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(GROUP_OPEN_KEY(group.key));
    if (stored !== null) setOpen(stored === "1");
    else if (hasActiveChild) setOpen(true);
  }, [group.key, hasActiveChild]);

  function toggle() {
    setOpen((v) => {
      const next = !v;
      localStorage.setItem(GROUP_OPEN_KEY(group.key), next ? "1" : "0");
      return next;
    });
  }

  if (collapsed) {
    return (
      <button
        onClick={toggle}
        title={group.label}
        className="flex justify-center items-center h-9 w-9 mx-auto rounded-md text-fg-2 hover:bg-bg-2 transition-colors"
      >
        <Icon name={group.icon} size={15} />
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={toggle}
        className={`w-full flex items-center gap-[10px] px-[10px] py-[7px] rounded-md text-[13px] text-left transition-colors ${
          hasActiveChild ? "text-fg-0 font-medium" : "text-fg-1 hover:bg-bg-2"
        }`}
      >
        <Icon name={group.icon} size={15} className={hasActiveChild ? "text-fg-0" : "text-fg-2"} />
        <span className="flex-1 truncate">{group.labelKey ? t(group.labelKey) : group.label}</span>
        <Icon
          name={open ? "arrowLeft" : "arrowRight"}
          size={11}
          className={`text-fg-3 transition-transform ${open ? "-rotate-90" : "rotate-90"}`}
        />
      </button>
      {open && (
        <div className="mt-[2px] flex flex-col gap-[2px]">
          {group.children.map((child) => (
            <NavItemRow key={child.key} item={child} pathname={pathname} collapsed={false} indent />
          ))}
        </div>
      )}
    </div>
  );
}

function UserMenu({
  role,
  onSignOut,
}: {
  role?: "user" | "admin";
  onSignOut: () => void;
}) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("mousedown", handle);
    return () => window.removeEventListener("mousedown", handle);
  }, []);

  const profileHref = role === "admin" ? "/admin/profile" : "/settings";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="bg-transparent border-0 text-fg-2 hover:text-fg-0 p-1 cursor-pointer"
      >
        <Icon name="more" size={14} />
      </button>
      {open && (
        <div className="absolute end-0 bottom-[calc(100%+4px)] z-50 min-w-[180px] bg-bg-2 border border-line-2 rounded-lg p-1 shadow-card">
          <Link
            href={profileHref}
            onClick={() => setOpen(false)}
            className="w-full flex items-center gap-2 px-[10px] py-[7px] text-[13px] text-fg-0 hover:bg-bg-3 rounded text-left"
          >
            <Icon name="user" size={14} className="text-fg-2" />
            {t("nav.profile")}
          </Link>
          <div className="my-1 border-t border-line" />
          <button
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
            className="w-full flex items-center gap-2 px-[10px] py-[7px] text-[13px] text-fg-0 hover:bg-bg-3 rounded text-left"
          >
            <Icon name="logout" size={14} className="text-fg-2" />
            {t("nav.signOut")}
          </button>
        </div>
      )}
    </div>
  );
}
