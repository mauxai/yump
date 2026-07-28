"use client";
import Link from "next/link";
import { useT } from "@/lib/i18n";
import { Icon } from "@/components/Icon";
import type { IconName } from "@/components/Icon";
import type { MetricsPayload } from "@/lib/metrics";
import { DashboardCharts } from "./DashboardCharts";

const COLOR_MAP = {
  accent: { bg: "bg-accent/10", border: "border-accent/20", icon: "text-accent", bar: "bg-accent" },
  blue:   { bg: "bg-blue-500/10", border: "border-blue-500/20", icon: "text-blue-400", bar: "bg-blue-500" },
  amber:  { bg: "bg-amber-500/10", border: "border-amber-500/20", icon: "text-amber-400", bar: "bg-amber-500" },
  green:  { bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: "text-emerald-400", bar: "bg-emerald-500" },
} as const;
type ColorKey = keyof typeof COLOR_MAP;

function KpiCard({
  label, value, sub, trend, trendLabel, icon, color, noTrendCount,
}: {
  label: string; value: string | number; sub?: string;
  trend?: number; trendLabel?: string; icon: string; color: ColorKey; noTrendCount?: boolean;
}) {
  const c = COLOR_MAP[color];
  return (
    <div className="bg-bg-1 border border-line rounded-[12px] p-3 sm:p-4 flex sm:flex-col flex-row items-center sm:items-stretch gap-3 sm:gap-3">
      <div className={`w-10 h-10 sm:hidden rounded-[10px] ${c.bg} border ${c.border} flex items-center justify-center shrink-0`}>
        <Icon name={icon as IconName} size={18} className={c.icon} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="hidden sm:flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.6px] text-fg-3">{label}</span>
          <div className={`w-7 h-7 rounded-[8px] ${c.bg} border ${c.border} flex items-center justify-center`}>
            <Icon name={icon as IconName} size={13} className={c.icon} />
          </div>
        </div>
        <span className="sm:hidden block text-[10px] font-semibold uppercase tracking-[0.5px] text-fg-3 mb-0.5">{label}</span>
        <div className="text-[20px] sm:text-[26px] font-bold tracking-tight text-fg-0 leading-none truncate">
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
        {sub && <div className="text-[11px] text-fg-3 mt-0.5 truncate">{sub}</div>}
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-[11px] font-medium mt-1 ${c.icon}`}>
            {!noTrendCount && <span>{trend.toLocaleString()}</span>}
            <span className="text-fg-3 font-normal truncate">{trendLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function DashboardContent({ m }: { m: MetricsPayload }) {
  const { t, lang } = useT();

  const today = new Date().toLocaleDateString(lang, {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
      <div className="mb-5 sm:mb-6">
        <h1 className="text-[20px] sm:text-[22px] font-semibold text-fg-0 tracking-tight">{t("adminDashboard.title")}</h1>
        <p className="text-[12px] sm:text-[13px] text-fg-3 mt-0.5" suppressHydrationWarning>{today}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-6">
        <KpiCard
          label={t("adminDashboard.totalUsers")}
          value={m.users.total}
          sub={t("adminDashboard.todayPlus", { n: m.users.new1d })}
          trend={m.users.new7d}
          trendLabel={t("adminDashboard.newThisWeek")}
          icon="user" color="accent"
        />
        <KpiCard
          label={t("adminDashboard.totalEdits")}
          value={m.edits.total}
          sub={t("adminDashboard.todayPlus", { n: m.edits.today })}
          trend={m.edits.d7}
          trendLabel={t("adminDashboard.thisWeek")}
          icon="image" color="blue"
        />
        <KpiCard
          label={t("adminDashboard.creditsUsed")}
          value={m.credits.totalUsedSnapshot}
          sub={t("adminDashboard.activeUsers", { n: m.activity.active7d })}
          trend={m.edits.d30}
          trendLabel={t("adminDashboard.editsLast30d")}
          icon="bolt" color="amber"
        />
        <KpiCard
          label={t("adminDashboard.totalEarnings")}
          value={`$${m.revenue.total.toFixed(2)}`}
          sub={t("adminDashboard.last30dRevenue", { n: m.revenue.d30.toFixed(2) })}
          trend={m.revenue.d7}
          trendLabel={t("adminDashboard.thisWeekRevenue", { n: m.revenue.d7.toFixed(2) })}
          icon="credit" color="green" noTrendCount
        />
      </div>

      <DashboardCharts
        editsDaily={m.series.editsDaily}
        usersDaily={m.series.usersDaily}
        revenueDaily={m.series.revenueDaily}
        modelDaily={m.modelDaily}
        modelUsage={m.modelUsage}
      />

      {/* Day-wise credit usage */}
      <div className="bg-bg-1 border border-line rounded-[12px] overflow-hidden mb-5 sm:mb-6">
        <div className="px-4 sm:px-5 py-3 sm:py-3.5 border-b border-line bg-bg-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="bolt" size={13} className="text-amber-400" />
            <span className="text-[13px] font-semibold text-fg-0">{t("adminDashboard.dayWiseCredit")}</span>
          </div>
          <span className="text-[11px] text-fg-3">{t("adminDashboard.last7Days")}</span>
        </div>
        {m.creditsD7.length === 0 ? (
          <div className="p-5 text-[13px] text-fg-3">{t("adminDashboard.noCreditUsage")}</div>
        ) : (
          <div className="grid grid-cols-7 divide-x divide-line overflow-x-auto">
            {(() => {
              const max = Math.max(...m.creditsD7.map((d) => d.credits), 1);
              return m.creditsD7.map((d) => {
                const pct = Math.round((d.credits / max) * 100);
                const dateLabel = new Date(d.date + "T00:00:00").toLocaleDateString(lang, { month: "short", day: "numeric" });
                const dayLabel  = new Date(d.date + "T00:00:00").toLocaleDateString(lang, { weekday: "short" });
                return (
                  <div key={d.date} className="flex flex-col items-center gap-1.5 px-2 sm:px-4 py-3 sm:py-4 min-w-0">
                    <span className="text-[10px] sm:text-[11px] text-fg-3 font-medium" suppressHydrationWarning>{dayLabel}</span>
                    <span className="text-[9px] sm:text-[10px] text-fg-3 mono" suppressHydrationWarning>{dateLabel}</span>
                    <div className="w-full bg-bg-3 rounded-full h-1 sm:h-1.5 mt-1">
                      <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[15px] sm:text-[18px] font-bold text-fg-0">{d.credits}</span>
                    <span className="text-[9px] sm:text-[10px] text-fg-3">{t("adminDashboard.credits")}</span>
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>

      {/* Bottom panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">

        {/* Top users */}
        <div className="bg-bg-1 border border-line rounded-[12px] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-line bg-bg-2 flex items-center justify-between">
            <span className="text-[13px] font-semibold text-fg-0">{t("adminDashboard.topUsers")}</span>
            <Link href="/admin/users" className="text-[11px] text-accent hover:underline">{t("adminDashboard.viewAll")}</Link>
          </div>
          {m.top.length === 0 ? (
            <div className="p-5 text-[13px] text-fg-3">{t("adminDashboard.noEditsYet")}</div>
          ) : (
            <div className="divide-y divide-line">
              {m.top.map((u, i) => (
                <Link key={u.id} href={`/admin/users/${u.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-bg-2 transition-colors">
                  <span className="mono text-[11px] text-fg-3 w-5 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-fg-0 truncate">{u.name ?? u.email}</div>
                    <div className="text-[11px] text-fg-3 mono truncate">{u.email}</div>
                  </div>
                  <span className="shrink-0 text-[11px] font-semibold text-accent bg-accent/10 rounded-md px-2 py-0.5">
                    {t("adminDashboard.editsCount", { n: u.editCount })}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* AI Models */}
        <div className="bg-bg-1 border border-line rounded-[12px] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-line bg-bg-2 flex items-center justify-between">
            <span className="text-[13px] font-semibold text-fg-0">{t("adminDashboard.aiModels")}</span>
            <Link href="/admin/models" className="text-[11px] text-accent hover:underline">{t("adminDashboard.manage")}</Link>
          </div>
          {m.topModels.length === 0 ? (
            <div className="p-5 text-[13px] text-fg-3">{t("adminDashboard.noModels")}</div>
          ) : (
            <div className="divide-y divide-line">
              {m.topModels.map((model) => (
                <div key={model.id} className="flex items-center gap-3 px-5 py-3">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${model.isActive ? "bg-emerald-400" : "bg-fg-3"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-medium text-fg-0 truncate">{model.label}</span>
                      {model.isDefault && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-accent/10 text-accent uppercase tracking-wide shrink-0">
                          {t("adminDashboard.default")}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-fg-3 mono capitalize">{model.provider}</div>
                  </div>
                  <span className="shrink-0 text-[11px] font-semibold text-amber-400 bg-amber-400/10 rounded-md px-2 py-0.5">
                    {model.creditCost}cr
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent audit */}
        <div className="bg-bg-1 border border-line rounded-[12px] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-line bg-bg-2 flex items-center justify-between">
            <span className="text-[13px] font-semibold text-fg-0">{t("adminDashboard.recentActions")}</span>
            <Link href="/admin/audit" className="text-[11px] text-accent hover:underline">{t("adminDashboard.viewAll")}</Link>
          </div>
          {m.recentAudit.length === 0 ? (
            <div className="p-5 text-[13px] text-fg-3">{t("adminDashboard.noActions")}</div>
          ) : (
            <div className="divide-y divide-line">
              {m.recentAudit.map((a) => (
                <div key={a.id} className="flex items-start gap-3 px-5 py-3">
                  <div className="w-6 h-6 rounded-md bg-bg-3 border border-line flex items-center justify-center shrink-0 mt-0.5">
                    <Icon name="history" size={11} className="text-fg-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-fg-0">
                      {a.action}
                      {a.targetType && a.targetId && (
                        <span className="text-fg-3 font-normal"> → {a.targetType} </span>
                      )}
                    </div>
                    <div className="text-[11px] text-fg-3 mono mt-0.5" suppressHydrationWarning>
                      {new Date(a.createdAt).toLocaleString(lang)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
