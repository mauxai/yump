"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n";
import { Icon } from "@/components/Icon";
import { ProjectThumb } from "@/components/ProjectThumb";
import { UserAvatar } from "@/components/UserAvatar";

export type UserDetailData = {
  user: {
    id: string;
    email: string;
    name: string | null;
    avatar: string | null;
    status: string;
    creditsUsed: number;
    creditsTotal: number;
    lastActiveAt: string | null;
    createdAt: string;
  };
  projects: Array<{
    id: string;
    name: string;
    updatedAt: string;
    _count: { edits: number };
  }>;
  edits: Array<{
    id: string;
    projectId: string;
    prompt: string | null;
    createdAt: string;
  }>;
  modelUsage: Array<{ label: string; edits: number; credits: number }>;
  totalEarnings: number;
  totalPurchases: number;
};

const KPI_COLORS = {
  accent: { bg: "bg-accent/10", border: "border-accent/20", icon: "text-accent" },
  blue:   { bg: "bg-blue-500/10", border: "border-blue-500/20", icon: "text-blue-400" },
  amber:  { bg: "bg-amber-500/10", border: "border-amber-500/20", icon: "text-amber-400" },
  green:  { bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: "text-emerald-400" },
} as const;

function StatusPill({ status, t }: { status: string; t: (k: string) => string }) {
  return status === "suspended" ? (
    <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--danger)]/10 text-[var(--danger)] uppercase tracking-wide">
      {t("adminUserDetail.statusSuspended")}
    </span>
  ) : (
    <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 uppercase tracking-wide">
      {t("adminUserDetail.statusActive")}
    </span>
  );
}

function KpiCard({ label, value, sub, color, icon }: {
  label: string; value: string | number; sub?: string;
  color: keyof typeof KPI_COLORS; icon: string;
}) {
  const c = KPI_COLORS[color];
  return (
    <div className="bg-bg-1 border border-line rounded-[12px] p-3 sm:p-4 flex sm:flex-col flex-row items-center sm:items-stretch gap-3 sm:gap-2">
      <div className={`w-9 h-9 sm:hidden rounded-[9px] ${c.bg} border ${c.border} flex items-center justify-center shrink-0`}>
        <Icon name={icon as Parameters<typeof Icon>[0]["name"]} size={16} className={c.icon} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="hidden sm:flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.6px] text-fg-3">{label}</span>
          <div className={`w-6 h-6 rounded-[7px] ${c.bg} border ${c.border} flex items-center justify-center`}>
            <Icon name={icon as Parameters<typeof Icon>[0]["name"]} size={12} className={c.icon} />
          </div>
        </div>
        <span className="sm:hidden block text-[9px] font-semibold uppercase tracking-[0.5px] text-fg-3 mb-0.5">{label}</span>
        <div className="text-[18px] sm:text-[22px] font-bold tracking-tight text-fg-0 leading-none truncate">
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
        {sub && <div className="text-[10px] sm:text-[11px] text-fg-3 mt-0.5 truncate">{sub}</div>}
      </div>
    </div>
  );
}

function Card({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-bg-1 border border-line rounded-[12px] overflow-hidden">
      <div className="flex items-center gap-2 px-4 sm:px-5 py-3.5 border-b border-line bg-bg-2">
        <Icon name={icon as Parameters<typeof Icon>[0]["name"]} size={13} className="text-fg-3" />
        <span className="text-[13px] font-semibold text-fg-0">{title}</span>
      </div>
      <div className="px-4 sm:px-5 py-4">{children}</div>
    </div>
  );
}

function KV({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex justify-between py-[5px] text-[12px] border-b border-dashed border-line last:border-0 gap-4">
      <span className="text-fg-2 shrink-0">{k}</span>
      <span className={`text-fg-0 text-end truncate ${mono ? "mono" : ""}`}>{v}</span>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="text-[12px] text-fg-3 py-2">{text}</div>;
}

export function UserDetailContent({ data }: { data: UserDetailData }) {
  const { t, lang } = useT();
  const { user, projects, edits, modelUsage, totalEarnings, totalPurchases } = data;

  const displayName = user.name ?? user.email.split("@")[0];
  const creditsRemaining = user.creditsTotal - user.creditsUsed;
  const creditPct = user.creditsTotal > 0 ? Math.round((user.creditsUsed / user.creditsTotal) * 100) : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-[1200px] mx-auto">

      {/* Back */}
      <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-[12px] text-fg-2 hover:text-fg-0 mb-5">
        <Icon name="arrowLeft" size={12} /> {t("adminUserDetail.backToUsers")}
      </Link>

      {/* User header */}
      <div className="bg-bg-1 border border-line rounded-[14px] p-4 sm:p-6 mb-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <UserAvatar src={user.avatar} name={displayName} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-[18px] sm:text-[20px] font-semibold text-fg-0 tracking-tight">{displayName}</h1>
            <StatusPill status={user.status} t={t} />
          </div>
          <div className="text-[12px] text-fg-3 mono mt-0.5">{user.email}</div>
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <span className="text-[11px] text-fg-3">
              {t("adminUserDetail.joined")} <span className="text-fg-1" suppressHydrationWarning>{new Date(user.createdAt).toLocaleDateString(lang)}</span>
            </span>
            <span className="text-[11px] text-fg-3">
              {t("adminUserDetail.lastActive")} <span className="text-fg-1" suppressHydrationWarning>{user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleDateString(lang) : t("adminUserDetail.never")}</span>
            </span>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <KpiCard
          label={t("adminUserDetail.kpiEarnings")}
          value={`$${totalEarnings.toFixed(2)}`}
          sub={t("adminUserDetail.kpiPurchases", { n: totalPurchases })}
          color="green" icon="credit"
        />
        <KpiCard
          label={t("adminUserDetail.kpiCreditsUsed")}
          value={user.creditsUsed}
          sub={t("adminUserDetail.kpiOfTotal", { n: user.creditsTotal })}
          color="amber" icon="bolt"
        />
        <KpiCard
          label={t("adminUserDetail.kpiCreditsLeft")}
          value={creditsRemaining}
          sub={t("adminUserDetail.kpiPctUsed", { n: creditPct })}
          color="accent" icon="sparkles"
        />
        <KpiCard
          label={t("adminUserDetail.kpiProjects")}
          value={projects.length}
          sub={t("adminUserDetail.kpiRecentEdits", { n: edits.length })}
          color="blue" icon="folder"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">

        {/* Left column */}
        <div className="space-y-5">

          {/* Most used models */}
          <Card title={t("adminUserDetail.mostUsedModels")} icon="cpu">
            {modelUsage.length === 0 ? (
              <Empty text={t("adminUserDetail.noModelUsage")} />
            ) : (
              <div className="space-y-3">
                {modelUsage.map((m, i) => {
                  const maxEdits = modelUsage[0].edits;
                  const pct = Math.round((m.edits / maxEdits) * 100);
                  const colors = ["bg-accent", "bg-amber-400", "bg-emerald-400", "bg-violet-400", "bg-pink-400"];
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px] font-medium text-fg-0">{m.label}</span>
                        <div className="flex items-center gap-2 text-[11px] text-fg-3">
                          <span>{m.edits} {t("adminUserDetail.edits")}</span>
                          <span>·</span>
                          <span>{m.credits} {t("adminUserDetail.credits")}</span>
                        </div>
                      </div>
                      <div className="w-full bg-bg-3 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${colors[i % colors.length]} transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Projects */}
          <Card title={t("adminUserDetail.projects", { n: projects.length })} icon="folder">
            {projects.length === 0 ? (
              <Empty text={t("adminUserDetail.noProjects")} />
            ) : (
              <div className="divide-y divide-line -mx-1">
                {projects.map((p) => (
                  <Link key={p.id} href={`/admin/projects/${p.id}`}
                    className="flex items-center gap-3 py-2.5 px-1 hover:bg-bg-2 rounded-[6px] transition-colors">
                    <div className="w-10 h-8 rounded-[4px] overflow-hidden bg-bg-3 border border-line-2 shrink-0">
                      <ProjectThumb projectId={p.id} name={p.name} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] text-fg-0 truncate">{p.name}</div>
                      <div className="text-[11px] text-fg-3 mono" suppressHydrationWarning>{new Date(p.updatedAt).toLocaleDateString(lang)}</div>
                    </div>
                    <span className="shrink-0 text-[11px] font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-md">
                      {t("adminUserDetail.editsBadge", { n: p._count.edits })}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          {/* Recent edits */}
          <Card title={t("adminUserDetail.recentEdits", { n: edits.length })} icon="sparkles">
            {edits.length === 0 ? (
              <Empty text={t("adminUserDetail.noEdits")} />
            ) : (
              <div className="divide-y divide-line -mx-1">
                {edits.map((e) => (
                  <Link key={e.id} href={`/admin/projects/${e.projectId}`}
                    className="flex items-center gap-3 py-2.5 px-1 hover:bg-bg-2 rounded-[6px] transition-colors">
                    <div className="w-6 h-6 rounded-[6px] bg-accent/10 flex items-center justify-center shrink-0">
                      <Icon name="sparkles" size={11} className="text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] text-fg-0 truncate">{e.prompt}</div>
                      <div className="text-[10px] text-fg-3 mono" suppressHydrationWarning>{new Date(e.createdAt).toLocaleString(lang)}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-5">

          {/* Account details */}
          <Card title={t("adminUserDetail.accountDetails")} icon="user">
            <KV k={t("adminUserDetail.kvName")} v={user.name ?? "—"} />
            <KV k={t("adminUserDetail.kvEmail")} v={user.email} mono />
            <KV k={t("adminUserDetail.kvStatus")} v={user.status} />
            <KV k={t("adminUserDetail.kvCreditsRemaining")} v={`${creditsRemaining} / ${user.creditsTotal}`} mono />
            <KV k={t("adminUserDetail.kvCreditsUsed")} v={String(user.creditsUsed)} mono />
            <KV k={t("adminUserDetail.kvLastActive")} v={user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleString(lang) : t("adminUserDetail.never")} />
            <KV k={t("adminUserDetail.kvJoined")} v={new Date(user.createdAt).toLocaleDateString(lang)} />
          </Card>

          {/* Earnings */}
          <Card title={t("adminUserDetail.earningsFromUser")} icon="credit">
            <div className="flex items-end gap-2 mb-4">
              <span className="text-[32px] font-bold tracking-tight text-fg-0 leading-none">${totalEarnings.toFixed(2)}</span>
              <span className="text-[12px] text-fg-3 mb-1">{t("adminUserDetail.totalRevenue")}</span>
            </div>
            <KV k={t("adminUserDetail.kvPurchases")} v={String(totalPurchases)} />
            <KV k={t("adminUserDetail.kvAvgPerPurchase")} v={totalPurchases > 0 ? `$${(totalEarnings / totalPurchases).toFixed(2)}` : "—"} mono />
          </Card>

          {/* Credit bar */}
          <Card title={t("adminUserDetail.creditUsage")} icon="bolt">
            <div className="flex items-center justify-between text-[12px] mb-2">
              <span className="text-fg-2">{t("adminUserDetail.used")}</span>
              <span className="font-medium text-fg-0 mono">{user.creditsUsed} / {user.creditsTotal}</span>
            </div>
            <div className="w-full bg-bg-3 rounded-full h-2">
              <div className="h-2 rounded-full bg-amber-400 transition-all" style={{ width: `${creditPct}%` }} />
            </div>
            <div className="text-[11px] text-fg-3 mt-1.5 text-end">{creditPct}% {t("adminUserDetail.used").toLowerCase()}</div>
          </Card>

        </div>
      </div>
    </div>
  );
}
