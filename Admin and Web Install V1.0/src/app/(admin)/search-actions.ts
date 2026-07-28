"use server";

import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { loadMessages } from "@/lib/load-messages";
import type { Messages } from "@/lib/i18n";

export type SearchHit =
  | { type: "user";    id: string; title: string; subtitle: string }
  | { type: "project"; id: string; title: string; subtitle: string }
  | { type: "admin";   id: string; title: string; subtitle: string }
  | { type: "page";    id: string; title: string; subtitle: string; href: string };

export type SearchGroups = {
  pages:    SearchHit[];
  users:    SearchHit[];
  projects: SearchHit[];
  admins:   SearchHit[];
};

const EMPTY: SearchGroups = { pages: [], users: [], projects: [], admins: [] };

// titleKey refs adminNav.* or adminSearch.*; subtitleKey refs adminSearch.*
const ADMIN_PAGES: Array<{
  title: string; titleKey: string;
  subtitle: string; subtitleKey: string;
  href: string; keywords: string[];
}> = [
  { title: "Dashboard",           titleKey: "adminSearch.pageTitleDashboard",  subtitle: "Overview & stats",                         subtitleKey: "adminSearch.pageSubDashboard",      href: "/admin",                         keywords: ["dashboard", "home", "overview", "stats"] },
  { title: "Users",               titleKey: "adminNav.users",                  subtitle: "Manage user accounts",                     subtitleKey: "adminSearch.pageSubUsers",           href: "/admin/users",                   keywords: ["users", "accounts", "members", "customers"] },
  { title: "Audit Log",           titleKey: "adminNav.auditLog",               subtitle: "Admin activity history",                   subtitleKey: "adminSearch.pageSubAuditLog",        href: "/admin/audit",                   keywords: ["audit", "logs", "activity", "history", "actions"] },
  { title: "Projects",            titleKey: "adminSearch.pageTitleProjects",   subtitle: "Browse all user projects",                 subtitleKey: "adminSearch.pageSubProjects",        href: "/admin/projects",                keywords: ["projects", "images", "files", "user projects", "browse"] },
  { title: "AI Models",           titleKey: "adminNav.aiModels",               subtitle: "Manage AI provider credentials",           subtitleKey: "adminSearch.pageSubAiModels",        href: "/admin/models",                  keywords: ["ai", "models", "openai", "google", "gemini", "gpt", "providers", "credentials"] },
  { title: "New AI Model",        titleKey: "adminSearch.pageTitleNewAiModel", subtitle: "Add a new AI provider model",              subtitleKey: "adminSearch.pageSubNewAiModel",      href: "/admin/models/new",              keywords: ["new", "add", "create", "model", "ai", "provider"] },
  { title: "Prompts",             titleKey: "adminNav.prompts",                subtitle: "Manage editor suggested prompts",          subtitleKey: "adminSearch.pageSubPrompts",         href: "/admin/prompts",                 keywords: ["prompts", "suggestions", "editor", "text", "ai prompts"] },
  { title: "Effects",             titleKey: "adminNav.effects",                subtitle: "Manage image effect presets",              subtitleKey: "adminSearch.pageSubEffects",         href: "/admin/effects",                 keywords: ["effects", "presets", "filters", "image effects", "enhance", "style"] },
  { title: "Branding",            titleKey: "adminNav.branding",               subtitle: "Logo, name, colors, favicon",              subtitleKey: "adminSearch.pageSubBranding",        href: "/admin/branding",                keywords: ["branding", "brand", "logo", "color", "favicon", "name", "slogan", "theme", "primary"] },
  { title: "Plans",               titleKey: "adminNav.plans",                  subtitle: "Manage subscription plans",                subtitleKey: "adminSearch.pageSubPlans",           href: "/admin/plans",                   keywords: ["plans", "pricing", "subscription", "tiers", "billing"] },
  { title: "New Plan",            titleKey: "adminSearch.pageTitleNewPlan",    subtitle: "Create a new subscription plan",           subtitleKey: "adminSearch.pageSubNewPlan",         href: "/admin/plans/new",               keywords: ["new", "add", "create", "plan", "pricing", "subscription"] },
  { title: "Transactions",        titleKey: "adminNav.transactions",           subtitle: "View payment transaction history",         subtitleKey: "adminSearch.pageSubTransactions",    href: "/admin/transactions",            keywords: ["transactions", "payments", "history", "billing", "invoices"] },
  { title: "Business Settings",   titleKey: "adminNav.business",               subtitle: "Credits, free trial & business rules",     subtitleKey: "adminSearch.pageSubBusiness",        href: "/admin/business",                keywords: ["business", "credits", "free trial", "free credit", "rules"] },
  { title: "Languages",           titleKey: "adminNav.languages",              subtitle: "Manage i18n languages & translation files",subtitleKey: "adminSearch.pageSubLanguages",       href: "/admin/languages",               keywords: ["languages", "i18n", "translation", "locale", "internationalization", "rtl", "ltr"] },
  { title: "Settings",            titleKey: "adminNav.settings",               subtitle: "General, localization & storage",          subtitleKey: "adminSearch.pageSubSettings",        href: "/admin/settings",                keywords: ["settings", "general", "localization", "storage", "configuration"] },
  { title: "SMTP",                titleKey: "adminNav.smtp",                   subtitle: "Email / SMTP configuration",               subtitleKey: "adminSearch.pageSubSmtp",            href: "/admin/smtp",                    keywords: ["smtp", "email", "mail", "sendgrid", "mailgun", "notifications"] },
  { title: "Payment Gateway",     titleKey: "adminNav.gateway",                subtitle: "Stripe & payment gateway settings",        subtitleKey: "adminSearch.pageSubPaymentGateway",  href: "/admin/third-party/payment",     keywords: ["payment", "gateway", "stripe", "checkout", "webhook"] },
  { title: "New Payment Gateway", titleKey: "adminSearch.pageTitleNewGateway", subtitle: "Add a new payment or SMS gateway",         subtitleKey: "adminSearch.pageSubNewGateway",      href: "/admin/third-party/payment/new", keywords: ["new", "add", "payment", "gateway", "stripe", "sms", "twilio"] },
  { title: "OAuth",               titleKey: "adminNav.oauth",                  subtitle: "Google OAuth login configuration",         subtitleKey: "adminSearch.pageSubOAuth",           href: "/admin/third-party/oauth",       keywords: ["oauth", "google", "social login", "sso", "third party"] },
  { title: "Mail Templates",      titleKey: "adminNav.mailTemplates",          subtitle: "Manage email templates",                   subtitleKey: "adminSearch.pageSubMailTemplates",   href: "/admin/mail-templates",          keywords: ["mail", "email", "templates", "forgot password", "billing", "notification"] },
  { title: "My Profile",          titleKey: "adminSearch.pageTitleProfile",    subtitle: "Update your admin account",                subtitleKey: "adminSearch.pageSubProfile",         href: "/admin/profile",                 keywords: ["profile", "account", "password", "avatar", "me"] },
];

function tr(messages: Messages | null, key: string, fallback: string): string {
  if (!messages) return fallback;
  const dot = key.indexOf(".");
  if (dot === -1) return fallback;
  const section = key.slice(0, dot);
  const subkey = key.slice(dot + 1);
  return (messages[section] as Record<string, string> | undefined)?.[subkey] ?? fallback;
}

function matchPages(q: string, messages: Messages | null): SearchHit[] {
  const lower = q.toLowerCase();
  return ADMIN_PAGES
    .filter(
      (p) =>
        p.title.toLowerCase().includes(lower) ||
        p.subtitle.toLowerCase().includes(lower) ||
        p.keywords.some((k) => k.includes(lower)),
    )
    .slice(0, 5)
    .map((p) => ({
      type: "page" as const,
      id: p.href,
      title: tr(messages, p.titleKey, p.title),
      subtitle: tr(messages, p.subtitleKey, p.subtitle),
      href: p.href,
    }));
}

export async function adminSearch(query: string, lang = "en"): Promise<SearchGroups> {
  const admin = await requireAdmin();
  if (!admin) return EMPTY;

  const q = query.trim();
  if (q.length < 2) return EMPTY;

  const messages = lang !== "en" ? await loadMessages(lang) : null;

  const [users, projects, admins] = await Promise.all([
    prisma.user.findMany({
      where: {
        OR: [{ email: { contains: q } }, { name: { contains: q } }],
      },
      select: { id: true, name: true, email: true },
      take: 5,
    }),
    prisma.project.findMany({
      where: { name: { contains: q } },
      select: { id: true, name: true, user: { select: { email: true } } },
      take: 5,
    }),
    prisma.admin.findMany({
      where: {
        OR: [{ email: { contains: q } }, { name: { contains: q } }],
      },
      select: { id: true, name: true, email: true, role: true },
      take: 5,
    }),
  ]);

  return {
    pages: matchPages(q, messages),
    users: users.map((u) => ({
      type: "user" as const,
      id: u.id,
      title: u.name ?? u.email.split("@")[0],
      subtitle: u.email,
    })),
    projects: projects.map((p) => ({
      type: "project" as const,
      id: p.id,
      title: p.name,
      subtitle: p.user.email,
    })),
    admins: admins.map((a) => ({
      type: "admin" as const,
      id: a.id,
      title: a.name ?? a.email.split("@")[0],
      subtitle: `${a.email} · ${a.role}`,
    })),
  };
}
