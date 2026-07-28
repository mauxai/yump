"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useT } from "@/lib/i18n";

export type TxRow = {
  id: string;
  user_id: string;
  description: string;
  gateway_ref: string | null;
  amount: string;
  currency: string;
  status: string;
  credits_granted: number | null;
  created_at: Date;
  user_name: string | null;
  user_email: string | null;
};

function CopyBlock({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={copy}
      className="group relative flex items-start gap-3 rounded-[10px] border border-line bg-bg-2 px-4 py-3 cursor-pointer hover:border-accent-line hover:bg-bg-3 transition-colors"
    >
      <code className="flex-1 text-[12px] font-mono text-fg-0 break-all leading-relaxed select-all">
        {value}
      </code>
      <div className="shrink-0 mt-0.5 text-fg-3 group-hover:text-fg-0 transition-colors">
        {copied ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#10a37f]">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        )}
      </div>
      {copied && (
        <div className="absolute -top-7 right-0 bg-fg-0 text-bg-0 text-[10px] font-medium px-2 py-1 rounded-[4px] pointer-events-none">
          Copied!
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] text-fg-3 uppercase tracking-[0.6px] font-medium mb-1.5">{label}</div>
      {children}
    </div>
  );
}

function DetailPanel({ row, onClose }: { row: TxRow; onClose: () => void }) {
  const { t } = useT();
  const STATUS_CFG: Record<string, { label: string; dot: string; cls: string }> = {
    paid:     { label: t("adminTransactions.statusPaid"),     dot: "bg-[#10a37f]", cls: "bg-[#10a37f]/10 text-[#10a37f] border-[#10a37f]/20" },
    pending:  { label: t("adminTransactions.statusPending"),  dot: "bg-[#f59e0b]", cls: "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20" },
    failed:   { label: t("adminTransactions.statusFailed"),   dot: "bg-[#ef4444]", cls: "bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20" },
    refunded: { label: t("adminTransactions.statusRefunded"), dot: "bg-fg-3",       cls: "bg-fg-3/10 text-fg-2 border-line-2" },
  };
  const s = STATUS_CFG[row.status] ?? STATUS_CFG.pending;
  const dateStr = new Date(row.created_at).toLocaleDateString(undefined, {
    year: "numeric", month: "long", day: "numeric",
  });
  const timeStr = new Date(row.created_at).toLocaleTimeString(undefined, {
    hour: "2-digit", minute: "2-digit",
  });

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:flex-row sm:justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Panel — bottom sheet on mobile, right drawer on desktop */}
      <div className="relative w-full sm:w-[420px] sm:h-full bg-bg-0 sm:border-l border-t sm:border-t-0 border-line flex flex-col shadow-2xl rounded-t-2xl sm:rounded-none max-h-[90vh] sm:max-h-full">

        {/* Mobile pill */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-line-2" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-line shrink-0">
          <div>
            <div className="text-[10px] text-fg-3 uppercase tracking-[0.7px] font-medium mb-0.5">{t("adminTransactions.detailBilling")}</div>
            <h2 className="text-[17px] font-semibold text-fg-0 leading-tight">{t("adminTransactions.detailTitle")}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-[6px] flex items-center justify-center text-fg-3 hover:text-fg-0 hover:bg-bg-2 transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-5">

          {/* Status + date */}
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center gap-1.5 h-[24px] px-3 rounded-full border text-[11px] font-semibold ${s.cls}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
              {s.label}
            </span>
            <div className="text-right">
              <div className="text-[12px] text-fg-1 font-medium">{dateStr}</div>
              <div className="text-[11px] text-fg-3">{timeStr}</div>
            </div>
          </div>

          {/* User */}
          <div className="rounded-[10px] border border-line bg-bg-1 p-4">
            <div className="text-[10px] text-fg-3 uppercase tracking-[0.6px] font-medium mb-2">{t("adminTransactions.detailUser")}</div>
            <div className="text-[14px] font-semibold text-fg-0">{row.user_name ?? "—"}</div>
            <div className="text-[12px] text-fg-3 mt-0.5">{row.user_email ?? row.user_id}</div>
          </div>

          {/* Amount + Credits */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[10px] border border-line bg-bg-1 p-4">
              <div className="text-[10px] text-fg-3 uppercase tracking-[0.6px] font-medium mb-2">{t("adminTransactions.detailAmount")}</div>
              <div className="text-[22px] font-bold mono text-fg-0 leading-none">
                {Number(row.amount) === 0 ? "—" : Number(row.amount).toFixed(2)}
              </div>
              {Number(row.amount) > 0 && (
                <div className="text-[11px] text-fg-3 mt-1">{row.currency}</div>
              )}
            </div>
            <div className="rounded-[10px] border border-line bg-bg-1 p-4">
              <div className="text-[10px] text-fg-3 uppercase tracking-[0.6px] font-medium mb-2">{t("adminTransactions.detailCredits")}</div>
              {row.credits_granted != null ? (
                <>
                  <div className="text-[22px] font-bold mono text-accent leading-none">
                    +{row.credits_granted.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-fg-3 mt-1">{t("adminTransactions.detailGranted")}</div>
                </>
              ) : (
                <div className="text-[22px] font-bold mono text-fg-3 leading-none">—</div>
              )}
            </div>
          </div>

          {/* Description */}
          <DetailRow label={t("adminTransactions.detailDescription")}>
            <div className="rounded-[10px] border border-line bg-bg-1 px-4 py-3 text-[13px] text-fg-0 leading-relaxed">
              {row.description}
            </div>
          </DetailRow>

          {/* Gateway Reference */}
          {row.gateway_ref && (
            <DetailRow label={t("adminTransactions.detailGatewayRef")}>
              <CopyBlock value={row.gateway_ref} />
            </DetailRow>
          )}

          {/* Transaction ID */}
          <DetailRow label={t("adminTransactions.detailTransactionId")}>
            <div className="rounded-[10px] border border-line bg-bg-2 px-4 py-3">
              <code className="text-[11px] font-mono text-fg-3 break-all">{row.id}</code>
            </div>
          </DetailRow>

        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-4 border-t border-line shrink-0">
          <button
            onClick={onClose}
            className="w-full h-10 sm:h-9 rounded-[8px] border border-line-2 bg-bg-2 text-fg-1 text-[13px] font-medium hover:bg-bg-3 transition-colors"
          >
            {t("adminTransactions.close")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function TransactionTable({ rows }: { rows: TxRow[] }) {
  const { t } = useT();
  const STATUS_CFG: Record<string, { label: string; dot: string; cls: string }> = {
    paid:     { label: t("adminTransactions.statusPaid"),     dot: "bg-[#10a37f]", cls: "bg-[#10a37f]/10 text-[#10a37f] border-[#10a37f]/20" },
    pending:  { label: t("adminTransactions.statusPending"),  dot: "bg-[#f59e0b]", cls: "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20" },
    failed:   { label: t("adminTransactions.statusFailed"),   dot: "bg-[#ef4444]", cls: "bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20" },
    refunded: { label: t("adminTransactions.statusRefunded"), dot: "bg-fg-3",       cls: "bg-fg-3/10 text-fg-2 border-line-2" },
  };
  const [selected, setSelected] = useState<TxRow | null>(null);

  useEffect(() => {
    if (!selected) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setSelected(null); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [selected]);

  return (
    <>
      {rows.map((row) => {
        const s = STATUS_CFG[row.status] ?? STATUS_CFG.pending;
        const credits = row.credits_granted;
        const dateStr = new Date(row.created_at).toLocaleDateString(undefined, {
          year: "numeric", month: "short", day: "numeric",
        });
        return (
          <div key={row.id} className="border-b border-line last:border-0">

            {/* ── Desktop row ── */}
            <div
              onClick={() => setSelected(row)}
              className="hidden sm:grid grid-cols-[1fr_200px_90px_90px_110px_110px_120px_44px] px-6 py-[14px] items-center hover:bg-bg-2 transition-colors cursor-pointer group"
            >
              <div className="min-w-0">
                <div className="text-[13px] font-medium text-fg-0 truncate">{row.user_name ?? "—"}</div>
                <div className="text-[11px] text-fg-3 truncate">{row.user_email ?? row.user_id}</div>
              </div>
              <div className="text-[12px] text-fg-2 truncate pr-2">{row.description}</div>
              <div className="text-[13px] font-semibold mono text-fg-0">
                {credits != null ? (
                  <span className="flex items-center gap-1">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="text-accent shrink-0"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                    {credits.toLocaleString()}
                  </span>
                ) : "—"}
              </div>
              <div className="text-[13px] font-semibold mono text-fg-0">
                {Number(row.amount) === 0 ? "—" : `${row.currency} ${Number(row.amount).toFixed(2)}`}
              </div>
              <div className="text-[11px] text-fg-3 mono truncate pr-2">{row.gateway_ref ?? "—"}</div>
              <div className="text-[12px] text-fg-2">{dateStr}</div>
              <div>
                <span className={`inline-flex items-center gap-1.5 h-[22px] px-2.5 rounded-full border text-[10px] font-semibold ${s.cls}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                  {s.label}
                </span>
              </div>
              <div className="flex items-center justify-center">
                <div className="w-7 h-7 rounded-[6px] flex items-center justify-center text-fg-4 group-hover:text-fg-1 group-hover:bg-bg-3 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* ── Mobile card ── */}
            <div
              onClick={() => setSelected(row)}
              className="sm:hidden px-4 py-3 hover:bg-bg-2 transition-colors cursor-pointer active:bg-bg-2"
            >
              {/* Top: user + status */}
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-fg-0 truncate">{row.user_name ?? "—"}</div>
                  <div className="text-[11px] text-fg-3 truncate">{row.user_email ?? row.user_id}</div>
                </div>
                <span className={`shrink-0 inline-flex items-center gap-1 h-[20px] px-2 rounded-full border text-[10px] font-semibold ${s.cls}`}>
                  <span className={`w-1 h-1 rounded-full ${s.dot}`} />
                  {s.label}
                </span>
              </div>
              {/* Description */}
              <div className="text-[12px] text-fg-2 truncate mb-1.5">{row.description}</div>
              {/* Amount + credits + date */}
              <div className="flex items-center gap-3 text-[12px]">
                <span className="font-semibold mono text-fg-0">
                  {Number(row.amount) === 0 ? "—" : `${row.currency} ${Number(row.amount).toFixed(2)}`}
                </span>
                {credits != null && (
                  <>
                    <span className="w-px h-3 bg-line-2" />
                    <span className="flex items-center gap-1 font-semibold mono text-accent">
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" className="shrink-0"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                      {credits.toLocaleString()}
                    </span>
                  </>
                )}
                <span className="w-px h-3 bg-line-2" />
                <span className="text-fg-3">{dateStr}</span>
              </div>
            </div>

          </div>
        );
      })}

      {selected && <DetailPanel row={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
