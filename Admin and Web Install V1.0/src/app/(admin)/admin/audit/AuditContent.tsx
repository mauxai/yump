"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n";
import { Badge } from "@/components/ui";
import { ExternalLink, Search } from "lucide-react";

const ACTION_TONE: Record<string, "accent" | "muted" | "default"> = {
  SETTINGS_UPDATE: "accent",
  USER_SUSPEND: "default",
  USER_UNSUSPEND: "muted",
  USER_DELETE: "default",
  PROJECT_DELETE: "default",
  CREDITS_ADJUST: "accent",
};

export type AuditRow = {
  id: string;
  action: string;
  createdAt: string;
  ip: string | null;
  actorAdminId: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
};

export type ActorInfo = {
  id: string;
  email: string;
  name: string | null;
};

type Props = {
  filtered: AuditRow[];
  actorMap: Record<string, ActorInfo>;
  period: string;
  actorFilter: string;
  total: number;
  page: number;
  totalPages: number;
  pageNumbersList: (number | "…")[];
};

function buildUrl(period: string, actor: string, overrides: Record<string, string | undefined>) {
  const p = new URLSearchParams();
  const merged: Record<string, string | undefined> = { period, actor, ...overrides };
  for (const [k, v] of Object.entries(merged)) {
    if (v) p.set(k, v);
  }
  const qs = p.toString();
  return qs ? `/admin/audit?${qs}` : "/admin/audit";
}

export function AuditContent({ filtered, actorMap, period, actorFilter, total, page, totalPages, pageNumbersList }: Props) {
  const { t, lang } = useT();

  const PERIODS = [
    { label: t("adminAudit.periodToday"), value: "today" },
    { label: t("adminAudit.period7d"),    value: "7d"    },
    { label: t("adminAudit.period30d"),   value: "30d"   },
    { label: t("adminAudit.periodAll"),   value: ""      },
  ] as const;

  return (
    <div className="p-4 sm:p-6 lg:p-10">

      {/* Page heading */}
      <div className="mb-5 sm:mb-6">
        <div className="text-[11px] text-fg-3 uppercase tracking-[0.7px] font-medium mono mb-1">{t("adminAudit.adminPanel")}</div>
        <h1 className="text-[20px] sm:text-[22px] font-semibold tracking-tight text-fg-0">{t("adminAudit.title")}</h1>
        <p className="text-[13px] text-fg-2 mt-1">{t("adminAudit.subtitle")}</p>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Period pills */}
        <div className="flex items-center gap-1 bg-bg-2 border border-line-2 rounded-[8px] p-1 overflow-x-auto scrollbar-none shrink-0">
          {PERIODS.map((p) => (
            <Link
              key={p.value}
              href={buildUrl(p.value, actorFilter, { page: undefined })}
              className={`shrink-0 px-3 py-1 rounded-[6px] text-[12px] font-medium transition-colors whitespace-nowrap ${
                period === p.value
                  ? "bg-bg-0 text-fg-0 shadow-sm border border-line"
                  : "text-fg-2 hover:text-fg-0"
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>

        {/* Actor search */}
        <form action="/admin/audit" method="get" className="flex items-center gap-2 sm:ms-auto">
          {period && <input type="hidden" name="period" value={period} />}
          <input
            name="actor"
            defaultValue={actorFilter}
            placeholder={t("adminAudit.filterPlaceholder")}
            className="h-9 flex-1 sm:w-[180px] rounded-[8px] bg-bg-2 border border-line-2 text-fg-0 text-[12px] outline-none px-3 focus:border-accent-line"
          />
          <button
            type="submit"
            className="h-9 inline-flex items-center gap-1.5 px-3 rounded-[8px] bg-accent text-[var(--accent-fg)] text-[12px] font-medium hover:opacity-90 transition-opacity shrink-0"
          >
            <Search size={13} />
            {t("adminAudit.search")}
          </button>
          {actorFilter && (
            <Link
              href={buildUrl(period, "", { page: undefined })}
              className="h-9 inline-flex items-center px-2.5 rounded-[8px] border border-line-2 text-fg-2 text-[12px] hover:bg-bg-2 shrink-0"
            >
              {t("adminAudit.clear")}
            </Link>
          )}
        </form>

        <span className="text-[12px] text-fg-3 shrink-0">
          {t("adminAudit.events", { n: total })}
        </span>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="rounded-[10px] border border-line bg-bg-1 p-12 text-center text-fg-3 text-[13px]">
          {t("adminAudit.noActions")}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block rounded-[10px] border border-line bg-bg-1 overflow-hidden">
            <div className="grid grid-cols-[150px_160px_140px_minmax(0,1fr)_80px] px-4 py-2.5 border-b border-line bg-bg-2 text-[11px] text-fg-2 uppercase tracking-[0.45px] font-medium">
              <div>{t("adminAudit.colAction")}</div>
              <div>{t("adminAudit.colTimestamp")}</div>
              <div>{t("adminAudit.colActor")}</div>
              <div>{t("adminAudit.colChanges")}</div>
              <div className="text-end">{t("adminAudit.colDetails")}</div>
            </div>
            {filtered.map((r, i) => {
              const actor = actorMap[r.actorAdminId];
              const before = r.before;
              const after = r.after;
              const changedKeys = after ? Object.keys(after).filter((k) => String(after[k]) !== String(before?.[k] ?? "")) : [];
              return (
                <div key={r.id} className={`grid grid-cols-[150px_160px_140px_minmax(0,1fr)_80px] px-4 py-3 items-center hover:bg-bg-2 transition-colors ${i < filtered.length - 1 ? "border-b border-line" : ""}`}>
                  <div><Badge tone={ACTION_TONE[r.action] ?? "muted"} className="!text-[10px] !h-[18px] !px-[6px]">{r.action}</Badge></div>
                  <div className="mono text-[11px] text-fg-2 leading-tight" suppressHydrationWarning>
                    <div>{new Date(r.createdAt).toLocaleDateString(lang)}</div>
                    <div className="text-fg-3">{new Date(r.createdAt).toLocaleTimeString(lang)}</div>
                  </div>
                  <div className="text-[12px]">
                    {actor ? (
                      <>
                        <div className="text-fg-0 font-medium truncate">{actor.name ?? actor.email.split("@")[0]}</div>
                        {r.ip && <div className="mono text-[10px] text-fg-3 truncate">{r.ip}</div>}
                      </>
                    ) : <span className="text-fg-3 italic text-[11px]">{t("adminAudit.deletedAdmin")}</span>}
                  </div>
                  <div>
                    {changedKeys.length > 0 ? (
                      <div className="flex flex-wrap gap-x-3 gap-y-1">
                        {changedKeys.slice(0, 4).map((k) => {
                          const avStr = after![k] != null ? String(after![k]) : "";
                          return (
                            <div key={k} className="flex items-center gap-1 text-[11px]">
                              <span className="mono text-fg-2">{k.split(".").pop()}</span>
                              <span className="text-fg-3">→</span>
                              <span className="text-accent truncate max-w-[100px]">{avStr.startsWith("data:") ? "[image]" : avStr || "—"}</span>
                            </div>
                          );
                        })}
                        {changedKeys.length > 4 && <span className="text-[10px] text-fg-3">{t("adminAudit.more", { n: changedKeys.length - 4 })}</span>}
                      </div>
                    ) : <span className="text-[11px] text-fg-3 italic">—</span>}
                  </div>
                  <div className="flex justify-end">
                    <Link href={`/admin/audit/${r.id}`}
                      className="inline-flex items-center gap-1 h-7 px-2.5 rounded-[6px] border border-line-2 bg-bg-1 text-[11px] text-fg-1 hover:bg-bg-3 transition-colors">
                      {t("adminAudit.view")} <ExternalLink size={10} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile card list */}
          <div className="sm:hidden flex flex-col gap-2">
            {filtered.map((r) => {
              const actor = actorMap[r.actorAdminId];
              const before = r.before;
              const after = r.after;
              const changedKeys = after ? Object.keys(after).filter((k) => String(after[k]) !== String(before?.[k] ?? "")) : [];
              return (
                <div key={r.id} className="bg-bg-1 border border-line rounded-[12px] px-4 py-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <Badge tone={ACTION_TONE[r.action] ?? "muted"} className="!text-[10px] !h-[18px] !px-[6px] shrink-0">
                      {r.action}
                    </Badge>
                    <Link href={`/admin/audit/${r.id}`}
                      className="shrink-0 inline-flex items-center gap-1 h-6 px-2 rounded-[6px] bg-accent text-[var(--accent-fg)] text-[10px] font-medium">
                      {t("adminAudit.view")} <ExternalLink size={9} />
                    </Link>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12px] text-fg-0 font-medium truncate">
                      {actor ? (actor.name ?? actor.email.split("@")[0]) : <span className="text-fg-3 italic">{t("adminAudit.deletedAdmin")}</span>}
                    </span>
                    <span className="mono text-[10px] text-fg-3 shrink-0" suppressHydrationWarning>
                      {new Date(r.createdAt).toLocaleDateString(lang)} {new Date(r.createdAt).toLocaleTimeString(lang)}
                    </span>
                  </div>
                  {changedKeys.length > 0 && (
                    <div className="flex flex-wrap gap-x-2 gap-y-1">
                      {changedKeys.slice(0, 3).map((k) => {
                        const avStr = after![k] != null ? String(after![k]) : "";
                        return (
                          <span key={k} className="text-[10px] text-fg-3 mono">
                            {k.split(".").pop()} <span className="text-accent">{avStr.startsWith("data:") ? "[image]" : avStr || "—"}</span>
                          </span>
                        );
                      })}
                      {changedKeys.length > 3 && <span className="text-[10px] text-fg-3">{t("adminAudit.more", { n: changedKeys.length - 3 })}</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 gap-2">
          <div className="text-[12px] text-fg-3 shrink-0">
            {t("adminAudit.pageOf", { page, total: totalPages })}
          </div>
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {page > 1 && (
              <Link href={buildUrl(period, actorFilter, { page: String(page - 1) })} className="h-8 px-3 inline-flex items-center rounded-[6px] border border-line-2 bg-bg-2 text-fg-1 text-[12px] hover:bg-bg-3 shrink-0">{t("adminAudit.prev")}</Link>
            )}
            {pageNumbersList.map((n, i) =>
              n === "…" ? (
                <span key={`e${i}`} className="h-8 w-8 inline-flex items-center justify-center text-[12px] text-fg-3 shrink-0">…</span>
              ) : (
                <Link
                  key={n}
                  href={buildUrl(period, actorFilter, { page: String(n) })}
                  className={`h-8 w-8 inline-flex items-center justify-center rounded-[6px] text-[12px] font-medium transition-colors shrink-0 ${
                    n === page ? "bg-accent text-[var(--accent-fg)]" : "border border-line-2 bg-bg-2 text-fg-1 hover:bg-bg-3"
                  }`}
                >
                  {n}
                </Link>
              )
            )}
            {page < totalPages && (
              <Link href={buildUrl(period, actorFilter, { page: String(page + 1) })} className="h-8 px-3 inline-flex items-center rounded-[6px] border border-line-2 bg-bg-2 text-fg-1 text-[12px] hover:bg-bg-3 shrink-0">{t("adminAudit.next")}</Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
