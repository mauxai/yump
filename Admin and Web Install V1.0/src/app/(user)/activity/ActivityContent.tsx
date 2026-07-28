"use client";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { useT } from "@/lib/i18n";

type Edit = {
  id: string;
  prompt: string;
  image: string | null;
  createdAt: string;
  project: { id: string; name: string };
};

type Project = {
  id: string;
  name: string;
  editCount: number;
};

type Props = {
  edits: Edit[];
  total: number;
  totalEdits: number;
  projectCount: number;
  recentProjects: Project[];
  page: number;
  totalPages: number;
  q: string;
};

function pageUrl(q: string, p: number): string {
  const ps = new URLSearchParams();
  if (q) ps.set("q", q);
  if (p > 1) ps.set("page", String(p));
  const s = ps.toString();
  return `/activity${s ? `?${s}` : ""}`;
}

function relativeTime(date: Date, t: (k: string, p?: Record<string, string>) => string): string {
  const diff = Date.now() - date.getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1)  return t("activity.justNow");
  if (m < 60) return t("activity.mAgo", { m: String(m) });
  if (h < 24) return t("activity.hAgo", { h: String(h) });
  if (d < 7)  return t("activity.dAgo", { d: String(d) });
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function clockTime(date: Date): string {
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function dateLabel(date: Date, t: (k: string) => string): string {
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString())     return t("activity.today");
  if (date.toDateString() === yesterday.toDateString()) return t("activity.yesterday");
  return date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

function groupEdits(items: Edit[], t: (k: string) => string): [string, Edit[]][] {
  const map = new Map<string, Edit[]>();
  for (const item of items) {
    const key = dateLabel(new Date(item.createdAt), t);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return [...map.entries()];
}

export function ActivityContent({
  edits, total, totalEdits, projectCount, recentProjects,
  page, totalPages, q,
}: Props) {
  const { t } = useT();
  const groups = groupEdits(edits, t);

  const kpis = [
    { labelKey: "activity.totalEdits",     value: totalEdits,   icon: "bolt"   },
    { labelKey: "activity.projectsEdited", value: projectCount, icon: "folder" },
    { labelKey: "activity.thisPage",       value: edits.length, icon: "history" },
  ] as const;

  return (
    <div className="space-y-6 min-w-0 overflow-hidden">

      {/* KPI bar */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        {kpis.map((s) => (
          <div key={s.labelKey} className="bg-bg-1 border border-line rounded-[12px] px-3 py-3 md:px-5 md:py-4 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <div className="w-7 h-7 md:w-9 md:h-9 rounded-[8px] bg-accent/10 flex items-center justify-center shrink-0">
              <Icon name={s.icon} size={13} className="text-accent" />
            </div>
            <div className="min-w-0">
              <div className="text-[18px] md:text-[24px] font-semibold tracking-tight text-fg-0 leading-none">{s.value}</div>
              <div className="text-[10px] md:text-[11px] text-fg-3 mt-1 truncate">{t(s.labelKey)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main layout */}
      <div className="flex flex-col lg:flex-row gap-5 items-start w-full">

        {/* Left: feed */}
        <div className="flex-1 w-full min-w-0 overflow-hidden space-y-4">

          {/* Toolbar */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <form action="/activity" method="get" className="flex items-center gap-2 flex-1 min-w-0">
                <div className="relative flex items-center flex-1 min-w-0">
                  <input
                    name="q"
                    defaultValue={q}
                    placeholder={t("activity.searchPrompts")}
                    className="w-full h-9 pl-3 pr-9 rounded-[8px] bg-bg-2 border border-line-2 text-fg-0 text-[13px] outline-none focus:border-accent-line placeholder:text-fg-4"
                  />
                  <button type="submit" className="absolute right-0 h-9 w-9 flex items-center justify-center text-fg-3 hover:text-fg-0 transition-colors">
                    <Icon name="search" size={13} />
                  </button>
                </div>
                {q && (
                  <a href="/activity" className="h-9 px-3 inline-flex items-center rounded-[8px] border border-line-2 text-fg-2 text-[12px] hover:bg-bg-2 transition-colors shrink-0">
                    {t("activity.clear")}
                  </a>
                )}
              </form>
            </div>
            <div className="text-[12px] text-fg-3">
              {total} {total === 1 ? t("activity.editSingular") : t("activity.editPlural")}
              {q && <> {t("activity.forQuery", { q })}</>}
            </div>
          </div>

          {/* Empty */}
          {edits.length === 0 ? (
            <div className="bg-bg-1 border border-dashed border-line rounded-[12px] py-20 flex flex-col items-center gap-3 text-center">
              <div className="w-11 h-11 rounded-full bg-bg-3 flex items-center justify-center text-fg-3">
                <Icon name="bolt" size={20} />
              </div>
              <div className="text-[14px] font-semibold text-fg-0">
                {q ? t("activity.noResultsFor", { q }) : t("activity.noEditsYet")}
              </div>
              <div className="text-[12px] text-fg-3">
                {q ? t("activity.tryDifferent") : t("activity.runFirstPrompt")}
              </div>
              {!q && (
                <Link href="/projects" className="mt-1 h-8 px-4 inline-flex items-center gap-1.5 rounded-[8px] bg-accent text-[var(--accent-fg)] text-[12px] font-medium hover:opacity-90 transition-opacity">
                  <Icon name="folder" size={13} /> {t("activity.browseProjects")}
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* Timeline groups */}
              {groups.map(([label, group]) => (
                <div key={label} className="space-y-2">
                  <div className="flex items-center gap-3 px-1">
                    <span className="text-[11px] font-semibold text-fg-3 uppercase tracking-[0.6px] shrink-0">{label}</span>
                    <div className="flex-1 h-px bg-line" />
                    <span className="text-[10px] text-fg-4 shrink-0 tabular-nums bg-bg-2 border border-line px-1.5 py-0.5 rounded-full">{group.length}</span>
                  </div>

                  <div className="space-y-1.5 w-full">
                    {group.map((e) => {
                      const imgSrc = e.image
                        ? (e.image.startsWith("data:") || e.image.startsWith("http") ? e.image : `/storage/${e.image}`)
                        : null;

                      return (
                        <Link
                          key={e.id}
                          href={`/editor/${e.project.id}`}
                          className="group flex items-center gap-3 w-full bg-bg-1 border border-line rounded-[10px] px-3 py-2.5 hover:border-accent/30 hover:bg-bg-2 transition-all min-w-0 overflow-hidden"
                        >
                          <div className="w-11 h-11 rounded-[8px] overflow-hidden bg-bg-3 border border-line shrink-0">
                            {imgSrc ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={imgSrc} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-fg-4">
                                <Icon name="image" size={16} />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 w-0">
                            <div className="text-[13px] font-semibold text-fg-0 truncate leading-tight">{e.prompt}</div>
                            <div className="flex items-center gap-1 mt-1 overflow-hidden">
                              <Icon name="folder" size={10} className="text-fg-4 shrink-0" />
                              <span className="text-[11px] text-fg-3 truncate block min-w-0">{e.project.name}</span>
                            </div>
                          </div>
                          <div className="shrink-0 text-right pl-2">
                            <div className="text-[11px] font-medium text-fg-2">{relativeTime(new Date(e.createdAt), t)}</div>
                            <div className="text-[10px] text-fg-4 mt-0.5 tabular-nums hidden sm:block">{clockTime(new Date(e.createdAt))}</div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[12px] text-fg-3 mono">
                    {t("activity.pageOf", { page: String(page), total: String(totalPages), count: String(total) })}
                  </span>
                  <div className="flex items-center gap-1">
                    {page > 1 && (
                      <a href={pageUrl(q, page - 1)} className="h-8 px-3 inline-flex items-center gap-1.5 rounded-[8px] border border-line-2 bg-bg-2 text-fg-1 text-[12px] hover:bg-bg-3 transition-colors">
                        <Icon name="arrowLeft" size={12} /> {t("activity.prev")}
                      </a>
                    )}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                      .reduce<(number | "…")[]>((acc, p, i, arr) => {
                        if (i > 0 && (arr[i - 1] as number) + 1 < p) acc.push("…");
                        acc.push(p); return acc;
                      }, [])
                      .map((p, i) => p === "…"
                        ? <span key={`e${i}`} className="w-8 text-center text-fg-4 text-[12px]">…</span>
                        : <a key={p} href={pageUrl(q, p as number)} className={`h-8 w-8 inline-flex items-center justify-center rounded-[8px] border text-[12px] font-medium transition-colors ${p === page ? "bg-accent border-accent text-[var(--accent-fg)]" : "bg-bg-2 border-line-2 text-fg-1 hover:bg-bg-3"}`}>{p}</a>
                      )}
                    {page < totalPages && (
                      <a href={pageUrl(q, page + 1)} className="h-8 px-3 inline-flex items-center gap-1.5 rounded-[8px] border border-line-2 bg-bg-2 text-fg-1 text-[12px] hover:bg-bg-3 transition-colors">
                        {t("activity.next")} <Icon name="arrowRight" size={12} />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right: sidebar */}
        <div className="w-full lg:w-[240px] lg:shrink-0 space-y-4 order-first lg:order-none">

          {/* Active projects */}
          <div className="bg-bg-1 border border-line rounded-[12px] overflow-hidden">
            <div className="px-4 py-3 border-b border-line bg-bg-2 flex items-center justify-between">
              <span className="text-[12px] font-semibold text-fg-0">{t("activity.activeProjects")}</span>
              <Link href="/projects" className="text-[11px] text-accent hover:underline">{t("activity.viewAll")} →</Link>
            </div>
            {recentProjects.length === 0 ? (
              <div className="px-4 py-5 text-[12px] text-fg-3">{t("activity.noProjectsYet")}</div>
            ) : (
              <>
                {/* mobile: horizontal scroll */}
                <div className="flex lg:hidden gap-2 p-3 overflow-x-auto scrollbar-none">
                  {recentProjects.map((p) => (
                    <Link
                      key={p.id}
                      href={`/editor/${p.id}`}
                      className="flex-none flex items-center gap-2 px-3 py-2 rounded-[8px] bg-bg-2 border border-line hover:border-accent/30 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-[6px] bg-bg-3 border border-line flex items-center justify-center shrink-0">
                        <Icon name="folder" size={11} className="text-fg-3" />
                      </div>
                      <div>
                        <div className="text-[12px] font-medium text-fg-0 whitespace-nowrap max-w-[90px] truncate">{p.name}</div>
                        <div className="text-[10px] text-fg-4">{p.editCount} {p.editCount !== 1 ? t("activity.editPlural") : t("activity.editSingular")}</div>
                      </div>
                    </Link>
                  ))}
                </div>
                {/* desktop: vertical list */}
                <div className="hidden lg:block divide-y divide-line">
                  {recentProjects.map((p) => (
                    <Link
                      key={p.id}
                      href={`/editor/${p.id}`}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-bg-2 transition-colors group"
                    >
                      <div className="w-7 h-7 rounded-[6px] bg-bg-3 border border-line-2 flex items-center justify-center shrink-0">
                        <Icon name="folder" size={11} className="text-fg-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-medium text-fg-0 truncate">{p.name}</div>
                        <div className="text-[11px] text-fg-4 mono">{p.editCount} {p.editCount !== 1 ? t("activity.editPlural") : t("activity.editSingular")}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Quick tip */}
          <div className="hidden lg:block bg-accent/5 border border-accent/15 rounded-[12px] px-4 py-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="bolt" size={12} className="text-accent" />
              <span className="text-[11px] font-semibold text-accent uppercase tracking-[0.5px]">{t("activity.tip")}</span>
            </div>
            <p className="text-[12px] text-fg-2 leading-relaxed">
              {t("activity.tipText")}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
