"use client";
import { Icon } from "@/components/Icon";
import { UpgradeButton } from "@/components/UpgradeButton";
import { useT } from "@/lib/i18n";

type Plan = {
  id: string; name: string; price: number; credits: number; recommended: boolean;
};
type Gateway = { id: string; slug: string; title: string; logo: string | null };
type HistoryRow = {
  id: string; description: string; gateway_ref: string | null;
  amount: string; currency: string; status: string;
  credits_granted: number | null; plan_id: string | null; created_at: string;
};

function CreditRing({ pct }: { pct: number }) {
  const r = 40, circ = 2 * Math.PI * r, filled = Math.min(pct / 100, 1) * circ;
  const color = pct >= 90 ? "#ef4444" : pct >= 70 ? "#f59e0b" : "var(--accent, #10a37f)";
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" fill="none" className="shrink-0">
      <circle cx="50" cy="50" r={r} stroke="var(--bg-3)" strokeWidth="8" />
      <circle cx="50" cy="50" r={r} stroke={color} strokeWidth="8" strokeLinecap="round" fill="none"
        strokeDasharray={`${filled} ${circ - filled}`} strokeDashoffset={circ * 0.25} />
    </svg>
  );
}

export function BillingContent({
  credits, currentPlan, activePlans, activeGateways, history,
  historyMeta, currency, paymentSuccess, paymentCancelled,
}: {
  credits: { used: number; total: number; remaining: number; pct: number; barColor: string; statusTone: string };
  currentPlan: Plan | null;
  activePlans: Plan[];
  activeGateways: Gateway[];
  history: HistoryRow[];
  historyMeta: { total: number; hq: string; hs: string; hp: number; hTotalPages: number };
  currency: string;
  paymentSuccess: boolean;
  paymentCancelled: boolean;
}) {
  const { t } = useT();
  const { used, total, remaining, pct, barColor, statusTone } = credits;
  const { hq, hs, hp, hTotalPages, total: histTotal } = historyMeta;

  const statusLabel =
    remaining === 0 ? t("billing.depleted") : pct >= 70 ? t("billing.low") : t("billing.healthy");

  const STATUS_CFG: Record<string, { label: string; cls: string }> = {
    paid:     { label: t("billing.paid"),     cls: "bg-[#10a37f]/10 text-[#10a37f] border-[#10a37f]/20" },
    pending:  { label: t("billing.pending"),  cls: "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20" },
    failed:   { label: t("billing.failed"),   cls: "bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20" },
    refunded: { label: t("billing.refunded"), cls: "bg-fg-3/10 text-fg-2 border-line-2" },
  };

  function buildUrl(overrides: Record<string, string | undefined>) {
    const merged = { ...(hq ? { hq } : {}), ...(hs ? { hs } : {}), hp: String(hp), ...overrides };
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) { if (v) p.set(k, v); }
    return `/billing?${p.toString()}`;
  }

  function pageNumbers(cur: number, last: number): (number | "…")[] {
    const set = new Set([1, last, cur - 2, cur - 1, cur, cur + 1, cur + 2].filter(n => n >= 1 && n <= last));
    const sorted = [...set].sort((a, b) => a - b);
    const result: (number | "…")[] = [];
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push("…");
      result.push(sorted[i]);
    }
    return result;
  }

  function formatPrice(amount: number) {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount);
  }

  return (
    <div className="space-y-6">

      {/* Payment banners */}
      {paymentSuccess && (
        <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl border border-[#10a37f]/25 bg-[#10a37f]/8 text-[#10a37f]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4 12 14.01l-3-3"/>
          </svg>
          <p className="text-[13px] font-medium">{t("billing.paymentSuccess")}</p>
        </div>
      )}
      {paymentCancelled && (
        <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl border border-[#f59e0b]/25 bg-[#f59e0b]/8 text-[#f59e0b]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p className="text-[13px] font-medium">{t("billing.paymentCancelled")}</p>
        </div>
      )}

      {/* Credit overview */}
      <div className="rounded-2xl border border-line bg-bg-1 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-[auto_1px_1fr] gap-0">
          <div className="flex flex-col items-center justify-center gap-3 px-10 py-8">
            <div className="relative">
              <CreditRing pct={pct} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[22px] font-bold mono leading-none text-fg-0">{remaining}</span>
                <span className="text-[10px] text-fg-3 mt-0.5">/{total}</span>
              </div>
            </div>
            <div className="text-[11px] font-medium text-fg-3 uppercase tracking-[0.6px]">
              {t("billing.creditsLeft")}
            </div>
          </div>

          <div className="hidden md:block bg-line" />

          <div className="flex flex-col justify-between gap-5 px-7 py-7">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="text-[11px] text-fg-3 uppercase tracking-[0.7px] font-medium mb-1">
                  {t("billing.currentPlan")}
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-[22px] font-bold text-fg-0 tracking-tight">
                    {currentPlan ? currentPlan.name : t("billing.freePlan")}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusTone}`}>
                    {statusLabel}
                  </span>
                </div>
                {currentPlan && currentPlan.price > 0 && (
                  <div className="text-[12px] text-fg-3 mt-0.5">{formatPrice(currentPlan.price)}</div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 md:gap-3">
              {[
                { labelKey: "billing.totalLabel", value: total.toLocaleString(), accent: false },
                { labelKey: "billing.usedLabel",  value: used.toLocaleString(),  accent: false },
                { labelKey: "billing.leftLabel",  value: remaining.toLocaleString(), accent: true },
              ].map(({ labelKey, value, accent }) => (
                <div key={labelKey} className="rounded-xl border border-line bg-bg-2 px-4 py-3">
                  <div className={`text-[22px] font-bold mono tracking-tight leading-none ${accent ? (pct >= 90 ? "text-[#ef4444]" : pct >= 70 ? "text-[#f59e0b]" : "text-accent") : "text-fg-0"}`}>
                    {value}
                  </div>
                  <div className="text-[11px] text-fg-3 mt-1">{t(labelKey)}</div>
                </div>
              ))}
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-fg-3 mb-1.5">
                <span>{t("billing.consumedPct", { pct: String(pct) })}</span>
                <span>{t("billing.remainingPct", { pct: String(100 - pct) })}</span>
              </div>
              <div className="h-[5px] rounded-full bg-bg-3 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: barColor }} />
              </div>
            </div>
          </div>
        </div>

        {pct >= 90 && (
          <div className="flex items-center gap-2.5 px-6 py-3 bg-[#ef4444]/8 border-t border-[#ef4444]/15">
            <div className="w-1.5 h-1.5 rounded-full bg-[#ef4444] shrink-0 animate-pulse" />
            <p className="text-[12px] text-[#ef4444] font-medium">
              {remaining === 0
                ? t("billing.allCreditsExhausted")
                : t("billing.lowCreditsWarning", { remaining: String(remaining) })}
            </p>
          </div>
        )}
      </div>

      {/* Plans */}
      {activePlans.length > 0 && (
        <div id="plans">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-[14px] font-semibold text-fg-0">{t("billing.availablePlans")}</h2>
            <div className="flex-1 h-px bg-line" />
          </div>
          <div className={`grid gap-4 ${
            activePlans.length === 1 ? "grid-cols-1 max-w-xs" :
            activePlans.length === 2 ? "grid-cols-1 sm:grid-cols-2" :
            "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          }`}>
            {activePlans.map((plan) => {
              const isCurrent = currentPlan?.id === plan.id;
              const currentPrice = currentPlan?.price ?? 0;
              const isUpgrade = plan.price > currentPrice;
              const isPopular = !isCurrent && plan.recommended;
              return (
                <div key={plan.id} className={`relative rounded-2xl border flex flex-col overflow-hidden ${
                  isCurrent ? "border-accent shadow-[0_0_0_3px_rgba(16,163,127,0.12)]"
                  : isPopular ? "border-fg-0 shadow-md" : "border-line"
                } bg-bg-1`}>
                  {(isCurrent || isPopular) && (
                    <div className={`py-1.5 text-center text-[11px] font-semibold tracking-wide ${
                      isCurrent ? "bg-accent text-[var(--accent-fg)]" : "bg-fg-0 text-bg-0"
                    }`}>
                      {isCurrent ? `✓ ${t("billing.yourCurrentPlan")}` : t("billing.recommended")}
                    </div>
                  )}
                  <div className="flex flex-col flex-1 p-5 gap-4">
                    <div>
                      <div className="text-[15px] font-bold text-fg-0">{plan.name}</div>
                      <div className="mt-2 flex items-end gap-1 leading-none">
                        <span className="text-[28px] font-bold mono text-fg-0">
                          {plan.price === 0 ? t("billing.free") : formatPrice(plan.price)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-4 border-t border-line">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                        isCurrent ? "bg-accent/15 text-accent" : "bg-bg-3 text-fg-2"
                      }`}>
                        <Icon name="bolt" size={12} />
                      </div>
                      <span className="text-[13px] text-fg-1">
                        <strong className="text-fg-0">{plan.credits.toLocaleString()}</strong>{" "}
                        {t("billing.planCredits")}
                      </span>
                    </div>
                    <div className="mt-auto">
                      {isCurrent ? (
                        <div className="h-9 rounded-lg border border-accent/30 text-accent text-[13px] font-medium flex items-center justify-center">
                          {t("billing.active")}
                        </div>
                      ) : (
                        <UpgradeButton planId={plan.id} planName={plan.name} gateways={activeGateways} isDowngrade={!isUpgrade} />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activePlans.length === 0 && (
        <div className="rounded-2xl border border-dashed border-line bg-bg-1 py-14 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-bg-3 flex items-center justify-center text-fg-3">
            <Icon name="credit" size={20} />
          </div>
          <div className="text-[14px] font-medium text-fg-0">{t("billing.noPlansConfigured")}</div>
          <div className="text-[12px] text-fg-3 max-w-[260px]">{t("billing.contactAdmin")}</div>
        </div>
      )}

      {/* Billing history */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-[14px] font-semibold text-fg-0">{t("billing.billingHistory")}</h2>
          <div className="text-[11px] text-fg-3">{t("billing.totalCount", { count: String(histTotal) })}</div>
          <div className="flex-1 h-px bg-line" />
          <a
            href={`/api/v1/billing/export${hq || hs ? `?${new URLSearchParams({ ...(hq ? { hq } : {}), ...(hs ? { hs } : {}) }).toString()}` : ""}`}
            className="h-8 px-3 inline-flex items-center gap-1.5 rounded-[6px] border border-line-2 bg-bg-2 text-fg-2 text-[12px] hover:bg-bg-3 transition-colors shrink-0"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            {t("billing.exportCsv")}
          </a>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <div className="flex items-center gap-1 flex-wrap">
            {(["", "paid", "pending", "failed", "refunded"] as const).map((s) => {
              const label = s === "" ? t("common.all") : t(`billing.${s}`);
              const params = new URLSearchParams({ ...(hq ? { hq } : {}), ...(s ? { hs: s } : {}) });
              return (
                <a key={s} href={`/billing?${params.toString()}`}
                  className={`h-7 px-3 inline-flex items-center justify-center rounded-full text-[11px] font-medium transition-colors ${
                    hs === s ? "bg-accent text-[var(--accent-fg)]" : "bg-bg-2 border border-line-2 text-fg-2 hover:bg-bg-3"
                  }`}>
                  {label}
                </a>
              );
            })}
          </div>
          <div className="relative flex items-center w-full sm:ms-auto sm:w-[240px]">
            <form action="/billing" method="get" className="w-full flex items-center">
              <input name="hq" defaultValue={hq} placeholder={t("billing.searchPlaceholder")}
                className="w-full h-8 ps-3 pe-9 rounded-[6px] bg-bg-2 border border-line-2 text-fg-0 text-[12px] outline-none focus:border-accent-line placeholder:text-fg-4" />
              {hs && <input type="hidden" name="hs" value={hs} />}
              <button type="submit" className="absolute end-0 top-0 h-8 w-8 flex items-center justify-center rounded-e-[6px] text-fg-3 hover:text-fg-0 hover:bg-bg-3 transition-colors border-s border-line-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
                </svg>
              </button>
            </form>
          </div>
          {(hq || hs) && (
            <a href="/billing" className="h-8 px-3 inline-flex items-center rounded-[6px] border border-line-2 text-fg-2 text-[12px] hover:bg-bg-2 shrink-0">
              {t("billing.clear")}
            </a>
          )}
        </div>

        {history.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-bg-1 py-14 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-bg-3 flex items-center justify-center text-fg-3">
              <Icon name="history" size={20} />
            </div>
            <div className="text-[14px] font-medium text-fg-0">{t("billing.noTransactions")}</div>
            <div className="text-[12px] text-fg-3 max-w-[280px]">{t("billing.noTransactionsHint")}</div>
          </div>
        ) : (
          <div className="rounded-2xl border border-line bg-bg-1 overflow-hidden">
            {/* Mobile cards */}
            <div className="divide-y divide-line md:hidden">
              {history.map((row) => {
                const s = STATUS_CFG[row.status] ?? STATUS_CFG.pending;
                const dateStr = new Date(row.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
                return (
                  <div key={row.id} className="px-4 py-3 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-medium text-fg-0 truncate">{row.description}</div>
                        {row.gateway_ref && <div className="text-[10px] text-fg-3 mono truncate mt-0.5">{t("billing.ref")} {row.gateway_ref}</div>}
                      </div>
                      <span className={`shrink-0 inline-flex items-center h-[20px] px-2 rounded-full border text-[10px] font-medium uppercase tracking-wide ${s.cls}`}>{s.label}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[12px]">
                      {row.credits_granted != null && (
                        <span className="flex items-center gap-1 text-accent font-semibold">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                          +{row.credits_granted.toLocaleString()} {t("billing.planCredits")}
                        </span>
                      )}
                      <span className="text-fg-3">{dateStr}</span>
                      {Number(row.amount) > 0 && (
                        <span className="text-fg-2 font-medium mono ms-auto">{row.currency} {Number(row.amount).toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block">
              <div className="grid grid-cols-[1fr_90px_120px_100px_90px] px-6 py-3 border-b border-line bg-bg-2 text-[11px] text-fg-3 uppercase tracking-[0.5px]">
                <div>{t("billing.descriptionCol")}</div>
                <div>{t("billing.creditsCol")}</div>
                <div>{t("billing.date")}</div>
                <div>{t("billing.amount")}</div>
                <div>{t("billing.status")}</div>
              </div>
              {history.map((row) => {
                const s = STATUS_CFG[row.status] ?? STATUS_CFG.pending;
                const dateStr = new Date(row.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
                return (
                  <div key={row.id} className="grid grid-cols-[1fr_90px_120px_100px_90px] px-6 py-[14px] border-b border-line last:border-0 items-center hover:bg-bg-2 transition-colors">
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium text-fg-0 truncate">{row.description}</div>
                      {row.gateway_ref && <div className="text-[11px] text-fg-3 mono truncate mt-0.5">{t("billing.ref")} {row.gateway_ref}</div>}
                    </div>
                    <div className="text-[13px] font-semibold mono text-fg-0">
                      {row.credits_granted != null ? (
                        <span className="flex items-center gap-1 text-accent">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="shrink-0"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                          +{row.credits_granted.toLocaleString()}
                        </span>
                      ) : "—"}
                    </div>
                    <div className="text-[12px] text-fg-2">{dateStr}</div>
                    <div className="text-[13px] font-semibold text-fg-0 mono">
                      {Number(row.amount) === 0 ? "—" : `${row.currency} ${Number(row.amount).toFixed(2)}`}
                    </div>
                    <div>
                      <span className={`inline-flex items-center h-[20px] px-[8px] rounded-full border text-[10px] font-medium uppercase tracking-wide ${s.cls}`}>{s.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pagination */}
        {hTotalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-[12px] text-fg-3">
              {t("billing.pageOf", { page: String(hp), total: String(hTotalPages), count: String(histTotal) })}
            </div>
            <div className="flex items-center gap-1">
              {hp > 1 && (
                <a href={buildUrl({ hp: String(hp - 1) })} className="h-8 px-3 inline-flex items-center rounded-[6px] border border-line-2 bg-bg-2 text-fg-1 text-[12px] hover:bg-bg-3">
                  {t("billing.prev")}
                </a>
              )}
              {pageNumbers(hp, hTotalPages).map((n, i) =>
                n === "…" ? (
                  <span key={`e${i}`} className="h-8 w-8 inline-flex items-center justify-center text-[12px] text-fg-3">…</span>
                ) : (
                  <a key={n} href={buildUrl({ hp: String(n) })}
                    className={`h-8 w-8 inline-flex items-center justify-center rounded-[6px] text-[12px] font-medium transition-colors ${
                      n === hp ? "bg-accent text-[var(--accent-fg)]" : "border border-line-2 bg-bg-2 text-fg-1 hover:bg-bg-3"
                    }`}>
                    {n}
                  </a>
                )
              )}
              {hp < hTotalPages && (
                <a href={buildUrl({ hp: String(hp + 1) })} className="h-8 px-3 inline-flex items-center rounded-[6px] border border-line-2 bg-bg-2 text-fg-1 text-[12px] hover:bg-bg-3">
                  {t("billing.next")}
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
