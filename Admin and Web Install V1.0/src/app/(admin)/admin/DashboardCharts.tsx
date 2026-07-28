"use client";

import { useState, useEffect } from "react";
import { useT } from "@/lib/i18n";
import {
  AreaChart, Area,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar, Cell,
} from "recharts";
import type { DailyPoint } from "@/lib/metrics";

type ModelDailyRow = { date: string; modelId: string | null; label: string; edits: number; credits: number };
type ModelUsageRow = { modelId: string | null; label: string; edits: number; credits: number };

type Props = {
  editsDaily:   DailyPoint[];
  usersDaily:   DailyPoint[];
  revenueDaily: DailyPoint[];
  modelDaily:   ModelDailyRow[];
  modelUsage:   ModelUsageRow[];
};

type Preset = "today" | "7d" | "30d" | "3m" | "6m" | "1y" | "custom";


const MODEL_COLORS = [
  "var(--accent)",
  "#f59e0b",
  "#10a37f",
  "#a78bfa",
  "#f472b6",
  "#34d399",
  "#fb923c",
  "#818cf8",
];

function fmt(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtMonth(dateStr: string) {
  if (dateStr.length === 7) {
    const [year, month] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  }
  return fmt(dateStr);
}

function tickEvery5(data: DailyPoint[]) {
  return data.map((d, i) => (i % 5 === 0 || i === data.length - 1 ? fmt(d.date) : ""));
}

const TOOLTIP_STYLE = {
  backgroundColor: "var(--bg-1)",
  border: "1px solid var(--line)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--fg-0)",
  boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
  whiteSpace: "nowrap" as const,
  direction: "ltr" as const,
};

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-bg-1 border border-line rounded-[12px] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-line bg-bg-2 flex items-center justify-between">
        <span className="text-[13px] font-semibold text-fg-0">{title}</span>
        {subtitle && <span className="text-[11px] text-fg-3">{subtitle}</span>}
      </div>
      <div className="p-4 pt-5" dir="ltr">{children}</div>
    </div>
  );
}


function presetToDates(preset: Preset, customFrom: string, customTo: string): { from: Date; to: Date } {
  const to = new Date();
  switch (preset) {
    case "today": {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      return { from: start, to };
    }
    case "7d":  return { from: new Date(Date.now() - 7   * 86400000), to };
    case "30d": return { from: new Date(Date.now() - 30  * 86400000), to };
    case "3m":  return { from: new Date(Date.now() - 90  * 86400000), to };
    case "6m":  return { from: new Date(Date.now() - 180 * 86400000), to };
    case "1y":  return { from: new Date(Date.now() - 365 * 86400000), to };
    case "custom":
      return {
        from: customFrom ? new Date(customFrom) : new Date(Date.now() - 30 * 86400000),
        to:   customTo   ? new Date(customTo)   : to,
      };
  }
}

function autoGroupBy(from: Date, to: Date): "day" | "month" {
  const diffDays = (to.getTime() - from.getTime()) / 86400000;
  return diffDays > 90 ? "month" : "day";
}

/** Pivot modelDaily rows into { date, [label]: edits } for recharts stacked bar */
function pivotModelDaily(rows: ModelDailyRow[]): { pivoted: Record<string, number | string>[]; labels: string[] } {
  const dateMap = new Map<string, Record<string, number | string>>();
  const labelSet = new Set<string>();

  for (const row of rows) {
    labelSet.add(row.label);
    if (!dateMap.has(row.date)) {
      dateMap.set(row.date, { date: row.date });
    }
    const entry = dateMap.get(row.date)!;
    entry[row.label] = (Number(entry[row.label] ?? 0)) + row.edits;
  }

  const pivoted = Array.from(dateMap.values()).sort((a, b) =>
    String(a.date).localeCompare(String(b.date)),
  );

  return { pivoted, labels: Array.from(labelSet) };
}

type MetricsData = {
  editsDaily:   DailyPoint[];
  usersDaily:   DailyPoint[];
  revenueDaily: DailyPoint[];
  modelDaily:   ModelDailyRow[];
  modelUsage:   ModelUsageRow[];
};

export function DashboardCharts({ editsDaily, usersDaily, revenueDaily, modelDaily, modelUsage }: Props) {
  const { t } = useT();

  const PRESETS: Array<{ key: Preset; label: string }> = [
    { key: "today",  label: t("adminDashboard.presetToday")  },
    { key: "7d",     label: t("adminDashboard.preset7d")     },
    { key: "30d",    label: t("adminDashboard.preset30d")    },
    { key: "3m",     label: t("adminDashboard.preset3m")     },
    { key: "6m",     label: t("adminDashboard.preset6m")     },
    { key: "1y",     label: t("adminDashboard.preset1y")     },
    { key: "custom", label: t("adminDashboard.presetCustom") },
  ];

  const [preset,     setPreset]     = useState<Preset>("30d");
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo,   setCustomTo]   = useState<string>("");
  const [loading,    setLoading]    = useState(false);
  const [data,       setData]       = useState<MetricsData>({
    editsDaily, usersDaily, revenueDaily, modelDaily, modelUsage,
  });

  useEffect(() => {
    if (preset === "custom" && (!customFrom || !customTo)) return;

    const { from, to } = presetToDates(preset, customFrom, customTo);
    const groupBy = autoGroupBy(from, to);

    const params = new URLSearchParams({
      from:    from.toISOString(),
      to:      to.toISOString(),
      groupBy,
    });

    setLoading(true);
    fetch(`/api/admin/metrics?${params.toString()}`)
      .then((r) => r.json())
      .then((json: MetricsData) => setData(json))
      .catch(() => { /* keep existing data on error */ })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, customFrom, customTo]);

  const ticks5 = tickEvery5(data.editsDaily);
  const { pivoted: modelPivoted, labels: modelLabels } = pivotModelDaily(data.modelDaily);

  const isMonth = data.editsDaily.length > 0 && data.editsDaily[0]?.date?.length === 7;
  const dateFmt  = isMonth ? fmtMonth : fmt;

  return (
    <div>
      {/* Filter bar */}
      <div className="mb-5">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[12px] text-fg-3 font-medium shrink-0 mr-0.5">{t("adminDashboard.period")}</span>
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPreset(p.key)}
              className={`shrink-0 px-3 py-1 rounded-md text-[12px] font-medium border transition-colors ${
                preset === p.key
                  ? "bg-accent text-[var(--accent-fg)] border-accent"
                  : "bg-bg-2 text-fg-2 border-line hover:border-accent-line"
              }`}
            >
              {p.label}
            </button>
          ))}
          {loading && <span className="text-[11px] text-fg-3 ml-1 animate-pulse shrink-0">{t("adminDashboard.loading")}</span>}
        </div>
        {preset === "custom" && (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="h-8 px-2 text-[12px] bg-bg-2 border border-line rounded-md text-fg-0 outline-none flex-1 min-w-[130px]"
            />
            <span className="text-fg-3 text-[12px]">{t("adminDashboard.to")}</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="h-8 px-2 text-[12px] bg-bg-2 border border-line rounded-md text-fg-0 outline-none flex-1 min-w-[130px]"
            />
          </div>
        )}
      </div>

      {/* Row 1: main charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-5 sm:mb-6">

        {/* New users per day */}
        <ChartCard title={t("adminDashboard.chartNewUsers")}>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.usersDaily} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(v, i) => ticks5[i] ?? ""}
                tick={{ fontSize: 10, fill: "var(--fg-3)" }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: "var(--fg-3)" }}
                axisLine={false} tickLine={false}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelFormatter={(v: unknown) => dateFmt(String(v))}
                /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                formatter={(v: any) => [v, t("adminDashboard.tooltipNewUsers")]}
              />
              <Bar dataKey="value" fill="var(--accent)" radius={[3, 3, 0, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Credits used per day */}
        <ChartCard title={t("adminDashboard.chartCredits")}>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={data.editsDaily} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="credGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(v, i) => ticks5[i] ?? ""}
                tick={{ fontSize: 10, fill: "var(--fg-3)" }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: "var(--fg-3)" }}
                axisLine={false} tickLine={false}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelFormatter={(v: unknown) => dateFmt(String(v))}
                /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                formatter={(v: any) => [v, t("adminDashboard.tooltipCredits")]}
              />
              <Area
                type="monotone" dataKey="value"
                stroke="#f59e0b" strokeWidth={2}
                fill="url(#credGrad)" dot={false} activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Earnings — smooth curve, no fill */}
        <ChartCard title={t("adminDashboard.chartEarnings")}>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={data.revenueDaily} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(v, i) => ticks5[i] ?? ""}
                tick={{ fontSize: 10, fill: "var(--fg-3)" }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--fg-3)" }}
                axisLine={false} tickLine={false}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelFormatter={(v: unknown) => dateFmt(String(v))}
                /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                formatter={(v: any) => [`$${Number(v).toFixed(2)}`, t("adminDashboard.tooltipEarnings")]}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#10a37f"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, fill: "#10a37f", strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

      </div>

      {/* Row 2: model charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 mb-5 sm:mb-6">

        {/* Top Models by Usage — horizontal bar, each bar a distinct color */}
        <ChartCard title={t("adminDashboard.chartTopModels")} subtitle={t("adminDashboard.selectedPeriod")}>
          {data.modelUsage.length === 0 ? (
            <p className="text-[13px] text-fg-3">{t("adminDashboard.noModelUsage")}</p>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(180, data.modelUsage.length * 44)}>
              <BarChart
                layout="vertical"
                data={data.modelUsage}
                margin={{ top: 4, right: 48, left: 4, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" horizontal={false} />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 10, fill: "var(--fg-3)" }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={90}
                  tick={{ fontSize: 10, fill: "var(--fg-3)" }}
                  axisLine={false} tickLine={false}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                  formatter={(v: any, _name: any, props: any) => [
                    `${v} ${t("adminDashboard.tooltipEdits")} · ${props.payload.credits} ${t("adminDashboard.tooltipCreditsSuffix")}`,
                    props.payload.label,
                  ]}
                />
                <Bar dataKey="edits" radius={[0, 4, 4, 0]} maxBarSize={22}>
                  {data.modelUsage.map((_entry, idx) => (
                    <Cell key={idx} fill={MODEL_COLORS[idx % MODEL_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Model Usage Over Time — Google Trends style multi-line */}
        <ChartCard title={t("adminDashboard.chartModelTime")} subtitle={t("adminDashboard.selectedPeriod")}>
          {modelPivoted.length === 0 ? (
            <p className="text-[13px] text-fg-3">{t("adminDashboard.noModelUsage")}</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={modelPivoted} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => dateFmt(String(v))}
                  tick={{ fontSize: 10, fill: "var(--fg-3)" }}
                  axisLine={false} tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 10, fill: "var(--fg-3)" }}
                  axisLine={false} tickLine={false}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend
                  wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                  iconType="circle"
                  iconSize={8}
                />
                {modelLabels.map((label, idx) => (
                  <Line
                    key={label}
                    type="monotone"
                    dataKey={label}
                    stroke={MODEL_COLORS[idx % MODEL_COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

      </div>
    </div>
  );
}
