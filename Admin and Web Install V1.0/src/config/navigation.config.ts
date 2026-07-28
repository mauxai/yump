export interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: string;
}

export const userNavItems: NavItem[] = [
  { label: "Dashboard", href: "/",         icon: "grid" },
  { label: "Projects",  href: "/projects",  icon: "folder" },
  { label: "Gallery",   href: "/gallery",   icon: "image" },
  { label: "History",   href: "/history",   icon: "history" },
  { label: "Billing",   href: "/billing",   icon: "credit" },
  { label: "Settings",  href: "/settings",  icon: "settings" },
];

export const userSettingsNavItems: NavItem[] = [
  { label: "Profile",   href: "/settings",         icon: "user" },
  { label: "Billing",   href: "/settings/billing", icon: "credit" },
];

export const adminNavGroups = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard",    href: "/admin",                   icon: "grid" },
      { label: "Users",        href: "/admin/users",             icon: "users" },
      { label: "Projects",     href: "/admin/projects",          icon: "folder" },
      { label: "Transactions", href: "/admin/transactions",      icon: "credit" },
    ],
  },
  {
    label: "Configuration",
    items: [
      { label: "AI Models",    href: "/admin/models",            icon: "cpu" },
      { label: "Plans",        href: "/admin/plans",             icon: "layers" },
      { label: "Branding",     href: "/admin/branding",          icon: "palette" },
      { label: "Business",     href: "/admin/business",          icon: "building" },
      { label: "Suggestion",    href: "/admin/prompts",           icon: "message" },
      { label: "Effects",      href: "/admin/effects",           icon: "sparkles" },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Settings",     href: "/admin/settings",          icon: "settings" },
      { label: "SMTP",         href: "/admin/smtp",              icon: "mail" },
      { label: "Payments",     href: "/admin/third-party/payment", icon: "gateway" },
      { label: "Audit Log",    href: "/admin/audit",             icon: "shield" },
    ],
  },
];
