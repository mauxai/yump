"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n";
import { UserAvatar } from "@/components/UserAvatar";
import { Icon } from "@/components/Icon";

type User = {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  status: string;
  creditsUsed: number;
  creditsTotal: number;
  createdAt: Date;
  _count: { projects: number };
};

function StatusBadge({ status, t }: { status: string; t: (key: string) => string }) {
  return status === "suspended" ? (
    <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--danger)]/10 text-[var(--danger)] uppercase tracking-wide whitespace-nowrap">
      {t("adminUsers.statusSuspended")}
    </span>
  ) : (
    <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 uppercase tracking-wide whitespace-nowrap">
      {t("adminUsers.statusActive")}
    </span>
  );
}

export function UsersContent({ users, q }: { users: User[]; q: string }) {
  const { t, lang } = useT();

  return (
    <div className="p-4 sm:p-6 lg:p-10">

      {/* Page title */}
      <div className="mb-4 sm:mb-5">
        <h1 className="text-[18px] sm:text-[20px] font-semibold text-fg-0 tracking-tight">{t("adminUsers.title")}</h1>
        <p className="text-[12px] text-fg-3 mt-0.5">{t("adminUsers.total", { n: users.length })}</p>
      </div>

      {/* Search */}
      <form action="/admin/users" method="get" className="mb-4 flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder={t("adminUsers.searchPlaceholder")}
          className="flex-1 sm:max-w-[360px] h-9 rounded-[8px] bg-bg-2 border border-line-2 text-fg-0 text-[13px] outline-none px-3 focus:border-accent-line"
        />
        <button
          type="submit"
          className="h-9 inline-flex items-center gap-1.5 px-3 rounded-[8px] bg-accent text-[var(--accent-fg)] text-[12px] font-medium hover:opacity-90 transition-opacity shrink-0"
        >
          <Icon name="search" size={13} />
          {t("adminUsers.search")}
        </button>
        {q && (
          <Link
            href="/admin/users"
            className="h-9 inline-flex items-center px-3 rounded-[8px] bg-transparent border border-line-2 text-fg-2 text-[12px] hover:bg-bg-2 shrink-0"
          >
            {t("adminUsers.clear")}
          </Link>
        )}
      </form>

      {users.length === 0 ? (
        <div className="rounded-[10px] border border-line bg-bg-1 p-8 text-center text-fg-3 text-[13px]">
          {q ? t("adminUsers.noMatch", { q }) : t("adminUsers.noUsers")}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block rounded-[10px] border border-line bg-bg-1 overflow-hidden">
            <div className="grid grid-cols-[1fr_100px_90px_120px_100px_80px] px-4 py-[10px] border-b border-line text-[11px] text-fg-2 uppercase tracking-[0.4px]">
              <div>{t("adminUsers.colNameEmail")}</div>
              <div>{t("adminUsers.colStatus")}</div>
              <div>{t("adminUsers.colProjects")}</div>
              <div>{t("adminUsers.colCredits")}</div>
              <div>{t("adminUsers.colJoined")}</div>
              <div>{t("adminUsers.colAction")}</div>
            </div>
            {users.map((u) => (
              <div
                key={u.id}
                className="grid grid-cols-[1fr_100px_90px_120px_100px_80px] px-4 py-3 border-b border-line last:border-0 items-center hover:bg-bg-2 transition-colors"
              >
                <div className="min-w-0 flex items-center gap-3">
                  <UserAvatar src={u.avatar} name={u.name ?? u.email} size="sm" />
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium text-fg-0 truncate">{u.name ?? u.email}</div>
                    <div className="text-[11px] text-fg-3 mono truncate">{u.email}</div>
                  </div>
                </div>
                <div><StatusBadge status={u.status} t={t} /></div>
                <div className="mono text-[12px] text-fg-1">{u._count.projects}</div>
                <div className="mono text-[12px] text-fg-1">
                  {u.creditsTotal - u.creditsUsed}<span className="text-fg-3">/{u.creditsTotal}</span>
                </div>
                <div className="text-[12px] text-fg-2 mono" suppressHydrationWarning>
                  {u.createdAt.toLocaleDateString(lang)}
                </div>
                <div>
                  <Link
                    href={`/admin/users/${u.id}`}
                    className="inline-flex items-center gap-1 h-7 px-2.5 rounded-[6px] bg-accent text-[var(--accent-fg)] text-[11px] font-medium hover:opacity-90 transition-opacity"
                  >
                    {t("adminUsers.view")}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile card list */}
          <div className="sm:hidden flex flex-col gap-2">
            {users.map((u) => (
              <Link
                key={u.id}
                href={`/admin/users/${u.id}`}
                className="bg-bg-1 border border-line rounded-[12px] px-4 py-3 flex items-center gap-3 hover:bg-bg-2 transition-colors"
              >
                <UserAvatar src={u.avatar} name={u.name ?? u.email} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[13px] font-semibold text-fg-0 truncate">{u.name ?? u.email}</span>
                    <StatusBadge status={u.status} t={t} />
                  </div>
                  <div className="text-[11px] text-fg-3 mono truncate">{u.email}</div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[11px] text-fg-3">
                      <span className="text-fg-1 font-medium">{u._count.projects}</span> {t("adminUsers.projects")}
                    </span>
                    <span className="text-[11px] text-fg-3">
                      <span className="text-fg-1 font-medium mono">{u.creditsTotal - u.creditsUsed}/{u.creditsTotal}</span> {t("adminUsers.cr")}
                    </span>
                    <span className="text-[11px] text-fg-3 mono" suppressHydrationWarning>
                      {u.createdAt.toLocaleDateString(lang)}
                    </span>
                  </div>
                </div>
                <span className="shrink-0 inline-flex items-center h-7 px-2.5 rounded-[6px] bg-accent text-[var(--accent-fg)] text-[11px] font-medium">
                  {t("adminUsers.view")}
                </span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
