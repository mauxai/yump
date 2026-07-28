"use client";

import Link from "next/link";
import { TransactionTable, type TxRow } from "./TransactionTable";
import { useT } from "@/lib/i18n";

type Props = {
  rows: TxRow[];
  total: number;
  totalPages: number;
  totalRevenue: string;
  totalPaid: number;
  totalFailed: number;
  totalPending: number;
  q: string;
  status: string;
  page: number;
  exportUrl: string;
  pageNumbersList: (number | "…")[];
};

function buildUrl(q: string, status: string, page: number, overrides: Record<string, string | undefined>) {
  const p = new URLSearchParams();
  const merged = { q, status, page: String(page), ...overrides };
  for (const [k, v] of Object.entries(merged)) {
    if (v) p.set(k, v);
  }
  return `/admin/transactions?${p.toString()}`;
}

export function TransactionsContent({
  rows, total, totalPages, totalRevenue, totalPaid, totalFailed, totalPending,
  q, status, page, exportUrl, pageNumbersList,
}: Props) {
  const { t } = useT();

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-5 sm:mb-8">
        <div>
          <div className="text-[11px] text-fg-3 uppercase tracking-[0.7px] font-medium mono mb-1">{t("adminTransactions.breadcrumb")}</div>
          <h1 className="text-[22px] sm:text-[26px] font-semibold tracking-tight text-fg-0">{t("adminTransactions.title")}</h1>
          <p className="hidden sm:block text-[13px] text-fg-2 mt-1 max-w-[500px]">
            {t("adminTransactions.subtitle")}
          </p>
        </div>
        <a
          href={exportUrl}
          className="h-9 px-3 sm:px-4 inline-flex items-center gap-1.5 rounded-[8px] border border-line-2 bg-bg-2 text-fg-1 text-[13px] font-medium hover:bg-bg-3 transition-colors shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <span className="hidden sm:inline">{t("adminTransactions.exportCsv")}</span>
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-5 sm:mb-6">
        {[
          { label: t("adminTransactions.statRevenue"), value: `$${totalRevenue}`, sub: t("adminTransactions.statPaidSub").replace("{n}", String(totalPaid)) },
          { label: t("adminTransactions.statPaid"),    value: String(totalPaid),    sub: t("adminTransactions.statTransactions"), color: "text-[#10a37f]" },
          { label: t("adminTransactions.statFailed"),  value: String(totalFailed),  sub: t("adminTransactions.statTransactions"), color: "text-[#ef4444]" },
          { label: t("adminTransactions.statPending"), value: String(totalPending), sub: t("adminTransactions.statTransactions"), color: "text-[#f59e0b]" },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="rounded-xl border border-line bg-bg-1 px-3 sm:px-5 py-3 sm:py-4">
            <div className={`text-[20px] sm:text-[26px] font-semibold mono tracking-tight leading-tight ${color ?? "text-fg-0"}`}>{value}</div>
            <div className="text-[11px] sm:text-[12px] text-fg-2 mt-0.5">{label}</div>
            <div className="text-[10px] sm:text-[11px] text-fg-3 mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <form action="/admin/transactions" method="get" className="space-y-2 mb-4">
        {status && <input type="hidden" name="status" value={status} />}

        {/* Status pills row */}
        <div className="flex items-center gap-2">
          <div className="text-[12px] text-fg-3 shrink-0">
            {total !== 1
              ? t("adminTransactions.transactionCountPlural").replace("{n}", String(total))
              : t("adminTransactions.transactionCount").replace("{n}", String(total))}
          </div>
          <div className="flex-1 flex items-center gap-1 overflow-x-auto scrollbar-none">
            {(["", "paid", "pending", "failed", "refunded"] as const).map((s) => (
              <Link
                key={s}
                href={buildUrl(q, status, page, { status: s || undefined, page: "1" })}
                className={`h-7 px-3 inline-flex items-center justify-center rounded-full text-[11px] font-medium transition-colors shrink-0 ${
                  status === s
                    ? "bg-accent text-[var(--accent-fg)]"
                    : "bg-bg-2 border border-line-2 text-fg-2 hover:bg-bg-3"
                }`}
              >
                {s
                  ? ({
                      paid:     t("adminTransactions.statusPaid"),
                      pending:  t("adminTransactions.statusPending"),
                      failed:   t("adminTransactions.statusFailed"),
                      refunded: t("adminTransactions.statusRefunded"),
                    }[s] ?? s)
                  : t("adminTransactions.statusAll")}
              </Link>
            ))}
          </div>
        </div>

        {/* Search row */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 flex items-center">
            <input
              name="q"
              defaultValue={q}
              placeholder={t("adminTransactions.searchPlaceholder")}
              className="w-full h-9 pl-3 pr-9 rounded-[6px] bg-bg-2 border border-line-2 text-fg-0 text-[13px] outline-none focus:border-accent-line placeholder:text-fg-4"
            />
            <button
              type="submit"
              className="absolute right-0 top-0 h-9 w-9 flex items-center justify-center rounded-r-[6px] text-fg-3 hover:text-fg-0 hover:bg-bg-3 transition-colors border-l border-line-2"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
              </svg>
            </button>
          </div>
          {(q || status) && (
            <Link href="/admin/transactions" className="h-9 px-3 inline-flex items-center rounded-[6px] border border-line-2 text-fg-2 text-[12px] hover:bg-bg-2 shrink-0">
              {t("adminTransactions.clear")}
            </Link>
          )}
        </div>
      </form>

      {/* Table */}
      {rows.length === 0 ? (
        <div className="rounded-[10px] border border-dashed border-line bg-bg-1 py-20 flex flex-col items-center gap-3 text-center">
          <div className="text-[15px] font-medium text-fg-0">{t("adminTransactions.noTransactions")}</div>
          {(q || status) && (
            <Link href="/admin/transactions" className="text-[12px] text-accent hover:underline">{t("adminTransactions.clearFilters")}</Link>
          )}
        </div>
      ) : (
        <div className="rounded-[10px] border border-line bg-bg-1 overflow-hidden">
          {/* Desktop head */}
          <div className="hidden sm:grid grid-cols-[1fr_200px_90px_90px_110px_110px_120px_44px] px-6 py-[10px] border-b border-line bg-bg-2 text-[11px] text-fg-2 uppercase tracking-[0.4px]">
            <div>{t("adminTransactions.colUser")}</div>
            <div>{t("adminTransactions.colDescription")}</div>
            <div>{t("adminTransactions.colCredits")}</div>
            <div>{t("adminTransactions.colAmount")}</div>
            <div>{t("adminTransactions.colGatewayRef")}</div>
            <div>{t("adminTransactions.colDate")}</div>
            <div>{t("adminTransactions.colStatus")}</div>
            <div>{t("adminTransactions.colView")}</div>
          </div>

          <TransactionTable rows={rows} />
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 gap-2">
          <div className="text-[12px] text-fg-3 shrink-0">
            {t("adminTransactions.pageOf").replace("{page}", String(page)).replace("{total}", String(totalPages))}
          </div>
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {page > 1 && (
              <Link href={buildUrl(q, status, page, { page: String(page - 1) })} className="h-8 px-3 inline-flex items-center rounded-[6px] border border-line-2 bg-bg-2 text-fg-1 text-[12px] hover:bg-bg-3 shrink-0">{t("adminTransactions.prev")}</Link>
            )}
            {pageNumbersList.map((n, i) =>
              n === "…" ? (
                <span key={`e${i}`} className="h-8 w-8 inline-flex items-center justify-center text-[12px] text-fg-3 shrink-0">…</span>
              ) : (
                <Link
                  key={n}
                  href={buildUrl(q, status, page, { page: String(n) })}
                  className={`h-8 w-8 inline-flex items-center justify-center rounded-[6px] text-[12px] font-medium transition-colors shrink-0 ${
                    n === page ? "bg-accent text-[var(--accent-fg)]" : "border border-line-2 bg-bg-2 text-fg-1 hover:bg-bg-3"
                  }`}
                >
                  {n}
                </Link>
              )
            )}
            {page < totalPages && (
              <Link href={buildUrl(q, status, page, { page: String(page + 1) })} className="h-8 px-3 inline-flex items-center rounded-[6px] border border-line-2 bg-bg-2 text-fg-1 text-[12px] hover:bg-bg-3 shrink-0">{t("adminTransactions.next")}</Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
