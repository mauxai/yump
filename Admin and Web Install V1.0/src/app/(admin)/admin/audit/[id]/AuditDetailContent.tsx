"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n";
import { Badge } from "@/components/ui";
import { ArrowLeft, Globe, User, CalendarDays, Fingerprint, Tag } from "lucide-react";

const ACTION_TONE: Record<string, "accent" | "muted" | "default"> = {
  SETTINGS_UPDATE: "accent",
  USER_SUSPEND: "default",
  USER_UNSUSPEND: "muted",
  USER_DELETE: "default",
  PROJECT_DELETE: "default",
  CREDITS_ADJUST: "accent",
};

export type AuditDetailData = {
  id: string;
  action: string;
  createdAt: string;
  ip: string | null;
  actorAdminId: string;
  targetType: string | null;
  targetId: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  meta: Record<string, unknown> | null;
  actor: { id: string; email: string; name: string | null } | null;
};

function MetaRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="px-4 sm:px-5 py-3">
      <div className="flex items-center gap-1.5 text-[10px] text-fg-3 uppercase tracking-[0.5px] mono mb-1.5">
        {icon} {label}
      </div>
      <div>{children}</div>
    </div>
  );
}

export function AuditDetailContent({ data }: { data: AuditDetailData }) {
  const { t, lang } = useT();
  const { actor, before, after, meta } = data;

  const allKeys = Array.from(new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]));
  const changedKeys = allKeys.filter((k) => String(after?.[k] ?? "") !== String(before?.[k] ?? ""));
  const unchangedKeys = allKeys.filter((k) => !changedKeys.includes(k));

  const actorName = actor?.name ?? actor?.email.split("@")[0] ?? t("adminAuditDetail.adminDeleted");

  return (
    <div className="p-4 sm:p-6 lg:p-10">

      {/* Back nav */}
      <Link href="/admin/audit" className="inline-flex items-center gap-1.5 text-[12px] text-fg-2 hover:text-fg-0 mb-5">
        <ArrowLeft size={13} /> {t("adminAuditDetail.backToAuditLog")}
      </Link>

      {/* Page header card */}
      <div className="rounded-xl border border-line bg-bg-1 overflow-hidden mb-5">
        <div className="px-4 sm:px-6 py-4 sm:py-5 flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Badge tone={ACTION_TONE[data.action] ?? "muted"} className="shrink-0">{data.action}</Badge>
            <span className="mono text-[11px] text-fg-3 truncate">{data.id}</span>
          </div>
        </div>
        {/* Meta strip */}
        <div className="px-4 sm:px-6 py-3 border-t border-line bg-bg-2 flex flex-wrap gap-x-4 gap-y-2 text-[12px] text-fg-2">
          <span className="flex items-center gap-1.5" suppressHydrationWarning>
            <CalendarDays size={12} className="text-fg-3" />
            {new Date(data.createdAt).toLocaleString(lang)}
          </span>
          <span className="flex items-center gap-1.5">
            <User size={12} className="text-fg-3" />
            {actorName}
          </span>
          <span className="flex items-center gap-1.5">
            <Globe size={12} className="text-fg-3" />
            <span className="mono">{data.ip ?? "—"}</span>
          </span>
          {data.targetType && (
            <span className="flex items-center gap-1.5">
              <Tag size={12} className="text-fg-3" />
              {data.targetType}
              {data.targetId && <span className="mono text-[11px]">:{data.targetId.slice(0, 8)}…</span>}
            </span>
          )}
        </div>
      </div>

      {/* Main body */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">

        {/* LEFT */}
        <div className="space-y-5">

          {/* Changed fields */}
          {changedKeys.length > 0 && (
            <section className="rounded-xl border border-line bg-bg-1 overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-line flex items-center justify-between">
                <div className="text-[14px] font-semibold text-fg-0">{t("adminAuditDetail.changedFields")}</div>
                <span className="mono text-[11px] text-fg-3">{t("adminAuditDetail.fields", { n: changedKeys.length })}</span>
              </div>
              <div className="divide-y divide-line">
                {changedKeys.map((k) => {
                  const bv = before?.[k] != null ? String(before[k]) : "";
                  const av = after?.[k]  != null ? String(after[k])  : "";
                  const isImage = bv.startsWith("data:") || av.startsWith("data:");
                  return (
                    <div key={k} className="px-4 sm:px-6 py-4">
                      <div className="mono text-[11px] text-fg-2 mb-3">{k}</div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-[10px] text-fg-3 uppercase tracking-[0.5px] mb-2">{t("adminAuditDetail.before")}</div>
                          {isImage ? (
                            bv ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={bv} alt="before" className="h-14 w-14 rounded-[6px] object-cover border border-line-2" />
                            ) : (
                              <span className="text-[11px] text-fg-3 italic">{t("adminAuditDetail.none")}</span>
                            )
                          ) : (
                            <div className="text-[12px] text-fg-1 bg-bg-0 rounded-[6px] px-2.5 py-2 border border-line break-words min-h-[34px]">
                              {bv || <span className="text-fg-3 italic">{t("adminAuditDetail.empty")}</span>}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-[10px] text-accent uppercase tracking-[0.5px] mb-2">{t("adminAuditDetail.after")}</div>
                          {isImage ? (
                            av ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={av} alt="after" className="h-14 w-14 rounded-[6px] object-cover border border-accent/30" />
                            ) : (
                              <span className="text-[11px] text-fg-3 italic">{t("adminAuditDetail.removed")}</span>
                            )
                          ) : (
                            <div className="text-[12px] text-fg-0 bg-accent/5 rounded-[6px] px-2.5 py-2 border border-accent/25 break-words min-h-[34px]">
                              {av || <span className="text-fg-3 italic">{t("adminAuditDetail.empty")}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Unchanged fields */}
          {unchangedKeys.length > 0 && (
            <section className="rounded-xl border border-line bg-bg-1 overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-line flex items-center justify-between">
                <div className="text-[13px] font-semibold text-fg-1">{t("adminAuditDetail.unchangedFields")}</div>
                <span className="mono text-[11px] text-fg-3">{unchangedKeys.length}</span>
              </div>
              <div className="divide-y divide-line">
                {unchangedKeys.map((k) => {
                  const val = before?.[k] != null ? String(before[k]) : "";
                  const isImage = val.startsWith("data:");
                  return (
                    <div key={k} className="px-4 sm:px-6 py-2.5 flex items-center gap-3">
                      <span className="mono text-[11px] text-fg-2 w-28 sm:w-44 shrink-0 truncate">{k}</span>
                      {isImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={val} alt={k} className="h-8 w-8 rounded object-cover border border-line-2" />
                      ) : (
                        <span className="text-[12px] text-fg-1 truncate">
                          {val || <span className="text-fg-3 italic">{t("adminAuditDetail.empty")}</span>}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Fallback: raw meta */}
          {changedKeys.length === 0 && unchangedKeys.length === 0 && meta && (
            <section className="rounded-xl border border-line bg-bg-1 overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-line">
                <div className="text-[14px] font-semibold text-fg-0">{t("adminAuditDetail.metadata")}</div>
              </div>
              <pre className="px-4 sm:px-6 py-5 text-[12px] text-fg-1 mono whitespace-pre-wrap break-words">
                {JSON.stringify(meta, null, 2)}
              </pre>
            </section>
          )}
        </div>

        {/* RIGHT */}
        <div className="space-y-5">
          <section className="rounded-xl border border-line bg-bg-1 overflow-hidden">
            {/* Actor */}
            <div className="px-4 sm:px-5 py-4 border-b border-line">
              <div className="text-[12px] text-fg-3 uppercase tracking-[0.5px] mono mb-3">{t("adminAuditDetail.actor")}</div>
              {actor ? (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-[8px] bg-bg-3 border border-line-2 flex items-center justify-center text-[13px] font-semibold text-fg-0 shrink-0">
                    {actorName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-fg-0 truncate">{actorName}</div>
                    <div className="text-[11px] text-fg-3 mono truncate">{actor.email}</div>
                  </div>
                </div>
              ) : (
                <div className="text-[12px] text-fg-3 italic">
                  {t("adminAuditDetail.adminDeleted")} ({data.actorAdminId.slice(0, 12)}…)
                </div>
              )}
            </div>

            {/* Event metadata rows */}
            <div className="divide-y divide-line">
              <MetaRow icon={<Fingerprint size={12} />} label={t("adminAuditDetail.eventId")}>
                <span className="mono text-[11px] text-fg-1 break-all">{data.id}</span>
              </MetaRow>
              <MetaRow icon={<Globe size={12} />} label={t("adminAuditDetail.ipAddress")}>
                <span className="mono text-[12px] text-fg-0">{data.ip ?? "—"}</span>
              </MetaRow>
              <MetaRow icon={<CalendarDays size={12} />} label={t("adminAuditDetail.timestamp")}>
                <span className="mono text-[11px] text-fg-1" suppressHydrationWarning>{new Date(data.createdAt).toISOString()}</span>
              </MetaRow>
              {data.targetType && data.targetId && (
                <MetaRow icon={<Tag size={12} />} label={t("adminAuditDetail.target")}>
                  <Link
                    href={`/admin/${data.targetType}s/${data.targetId}`}
                    className="mono text-[11px] text-accent hover:underline break-all"
                  >
                    {data.targetType}:{data.targetId}
                  </Link>
                </MetaRow>
              )}
            </div>
          </section>

          {/* Raw meta */}
          {meta && (
            <section className="rounded-xl border border-line bg-bg-1 overflow-hidden">
              <div className="px-4 sm:px-5 py-3 border-b border-line">
                <div className="text-[12px] font-semibold text-fg-1">{t("adminAuditDetail.rawMetadata")}</div>
              </div>
              <pre className="px-4 sm:px-5 py-4 text-[10px] text-fg-2 mono whitespace-pre-wrap break-words leading-relaxed">
                {JSON.stringify(meta, null, 2)}
              </pre>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
