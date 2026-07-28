"use client";

import Link from "next/link";
import { Plug } from "lucide-react";
import { typeBadgeCls, GATEWAY_TYPES } from "@/lib/gateway-providers";
import { GatewayToggle } from "./GatewayRowActions";
import { GatewayLogo } from "./GatewayLogo";
import { buildStorageUrl } from "@/lib/storage-url";
import { useT } from "@/lib/i18n";

type GatewayRow = {
  id: string; name: string; type: string; mode: string;
  isActive: boolean; createdAt: Date;
  credentials: unknown; config: unknown;
};

type Props = {
  gateways: GatewayRow[];
  total: number;
  activeCount: number;
  q: string;
  typeFilter: string;
};

export function PaymentContent({ gateways, total, activeCount, q, typeFilter }: Props) {
  const { t } = useT();

  return (
    <>
      {/* Header */}
      <div className="mb-5 sm:mb-8">
        <div className="text-[11px] text-fg-3 uppercase tracking-[0.7px] font-medium mono mb-1">
          {t("adminPayments.breadcrumb")}
        </div>
        <h1 className="text-[22px] sm:text-[26px] font-semibold tracking-tight text-fg-0">{t("adminPayments.title")}</h1>
        <p className="text-[13px] text-fg-2 mt-1 max-w-[540px] hidden sm:block">
          {t("adminPayments.subtitle")}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-5 sm:mb-6">
        <div className="rounded-xl border border-line bg-bg-1 px-3 sm:px-5 py-3 sm:py-4">
          <div className="text-[20px] sm:text-[28px] font-semibold mono tracking-tight text-fg-0">{total}</div>
          <div className="text-[10px] sm:text-[12px] text-fg-2 mt-0.5 leading-tight">{t("adminPayments.statTotal")}</div>
        </div>
        <div className="rounded-xl border border-line bg-bg-1 px-3 sm:px-5 py-3 sm:py-4">
          <div className="text-[20px] sm:text-[28px] font-semibold mono tracking-tight text-[#10a37f]">{activeCount}</div>
          <div className="text-[10px] sm:text-[12px] text-fg-2 mt-0.5 leading-tight">{t("adminPayments.statActive")}</div>
        </div>
        <div className="rounded-xl border border-line bg-bg-1 px-3 sm:px-5 py-3 sm:py-4">
          <div className="text-[20px] sm:text-[28px] font-semibold mono tracking-tight text-fg-0">{total - activeCount}</div>
          <div className="text-[10px] sm:text-[12px] text-fg-2 mt-0.5 leading-tight">{t("adminPayments.statInactive")}</div>
        </div>
      </div>

      {/* Search + type filter */}
      <div className="flex flex-col gap-3 mb-4">
        <form action="/admin/third-party/payment" method="get" className="flex flex-col sm:flex-row sm:items-center gap-2">
          {typeFilter && <input type="hidden" name="type" value={typeFilter} />}
          <div className="text-[12px] text-fg-3 hidden sm:block">
            {gateways.length !== 1
              ? t("adminPayments.gatewayCountPlural").replace("{n}", String(gateways.length))
              : t("adminPayments.gatewayCount").replace("{n}", String(gateways.length))}
            {(q || typeFilter) ? ` of ${total}` : ""}
          </div>
          <div className="sm:ml-auto flex items-center gap-2">
            <div className="relative flex-1 sm:w-[260px] flex items-center">
              <input
                name="q"
                defaultValue={q}
                placeholder={t("adminPayments.searchPlaceholder")}
                className="w-full h-9 pl-3 pr-9 rounded-[6px] bg-bg-2 border border-line-2 text-fg-0 text-[13px] outline-none focus:border-accent-line placeholder:text-fg-4"
              />
              <button
                type="submit"
                className="absolute right-0 top-0 h-9 w-9 flex items-center justify-center rounded-r-[6px] text-fg-3 hover:text-fg-0 hover:bg-bg-3 transition-colors border-l border-line-2"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
                </svg>
              </button>
            </div>
            {(q || typeFilter) && (
              <Link
                href="/admin/third-party/payment"
                className="h-9 px-3 inline-flex items-center rounded-[6px] border border-line-2 bg-transparent text-fg-2 text-[12px] hover:bg-bg-2 shrink-0"
              >
                {t("adminPayments.clear")}
              </Link>
            )}
          </div>
        </form>

        {/* Type filter pills */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
          <Link
            href={q ? `/admin/third-party/payment?q=${q}` : "/admin/third-party/payment"}
            className={`shrink-0 h-7 px-3 inline-flex items-center rounded-full border text-[11px] font-medium transition-colors ${
              !typeFilter ? "bg-fg-0 text-bg-0 border-fg-0" : "bg-transparent text-fg-2 border-line-2 hover:text-fg-0"
            }`}
          >
            All
          </Link>
          {GATEWAY_TYPES.map((gt) => (
            <Link
              key={gt.value}
              href={`/admin/third-party/payment?type=${gt.value}${q ? `&q=${q}` : ""}`}
              className={`shrink-0 h-7 px-3 inline-flex items-center rounded-full border text-[11px] font-medium transition-colors ${
                typeFilter === gt.value
                  ? typeBadgeCls(gt.value) + " font-semibold"
                  : "bg-transparent text-fg-2 border-line-2 hover:text-fg-0"
              }`}
            >
              {gt.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Table */}
      {gateways.length === 0 ? (
        <div className="rounded-[10px] border border-dashed border-line bg-bg-1 py-20 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-bg-3 flex items-center justify-center text-fg-3">
            <Plug size={22} />
          </div>
          {q || typeFilter ? (
            <>
              <div className="text-[15px] font-medium text-fg-0">{t("adminPayments.noMatchTitle")}</div>
              <Link href="/admin/third-party/payment" className="text-[12px] text-accent hover:underline">{t("adminPayments.clearFilters")}</Link>
            </>
          ) : (
            <>
              <div className="text-[15px] font-medium text-fg-0">{t("adminPayments.noGatewaysTitle")}</div>
              <div className="text-[13px] text-fg-3 max-w-[280px]">
                {t("adminPayments.noGatewaysDesc")}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="rounded-[10px] border border-line bg-bg-1 overflow-hidden">
          {/* Desktop head */}
          <div className="hidden sm:grid grid-cols-[1fr_100px_90px_110px_80px_96px] px-6 py-[10px] border-b border-line bg-bg-2 text-[11px] text-fg-2 uppercase tracking-[0.4px]">
            <div>{t("adminPayments.colGateway")}</div>
            <div>{t("adminPayments.colType")}</div>
            <div>{t("adminPayments.colMode")}</div>
            <div>{t("adminPayments.colCredentials")}</div>
            <div>{t("adminPayments.colActive")}</div>
            <div className="text-right">{t("adminPayments.colActions")}</div>
          </div>

          {(gateways as GatewayRow[]).map((gw) => {
            const cfg = (gw.config as Record<string, string> | null) ?? {};
            const creds = (gw.credentials as Record<string, string> | null) ?? {};
            const filledCreds = Object.values(creds).filter(Boolean).length;
            const totalCreds = Object.keys(creds).length;
            const title = cfg.gateway_title || gw.name;
            const initials = title.slice(0, 2).toUpperCase();
            const logoSrc = cfg.gateway_image
              ? (cfg.gateway_image.startsWith("data:") ? cfg.gateway_image : (buildStorageUrl(`/storage/${cfg.gateway_image}`) ?? ""))
              : null;

            return (
              <div key={gw.id} className="border-b border-line last:border-0">

                {/* ── Desktop row ── */}
                <div className="hidden sm:grid grid-cols-[1fr_100px_90px_110px_80px_96px] px-6 py-[14px] items-center hover:bg-bg-2 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-bg-3 border border-line flex items-center justify-center text-[10px] font-bold text-fg-1 shrink-0 overflow-hidden">
                      {logoSrc ? <GatewayLogo src={logoSrc} initials={initials} /> : initials}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium text-fg-0">{title}</div>
                      <div className="text-[11px] text-fg-3 mono">{gw.name}</div>
                    </div>
                  </div>
                  <div>
                    <span className={`inline-flex items-center h-[20px] px-[8px] rounded-full border text-[10px] font-medium tracking-wide uppercase ${typeBadgeCls(gw.type)}`}>{gw.type}</span>
                  </div>
                  <div>
                    <span className={`inline-flex items-center h-[20px] px-[8px] rounded-full border text-[10px] font-medium ${gw.mode === "live" ? "bg-[#10a37f]/10 text-[#10a37f] border-[#10a37f]/20" : "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20"}`}>{gw.mode}</span>
                  </div>
                  <div className="text-[11px] space-y-0.5">
                    {totalCreds === 0 ? <span className="text-fg-4 italic">{t("adminPayments.noCredentials")}</span> : (
                      <>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${filledCreds === totalCreds ? "bg-accent" : "bg-[#f59e0b]"}`} />
                          <span className="text-fg-2">{t("adminPayments.filled").replace("{filled}", String(filledCreds)).replace("{total}", String(totalCreds))}</span>
                        </div>
                        {filledCreds < totalCreds && <div className="text-[10px] text-[var(--danger)]">{t("adminPayments.missing").replace("{n}", String(totalCreds - filledCreds))}</div>}
                      </>
                    )}
                  </div>
                  <div><GatewayToggle id={gw.id} isActive={gw.isActive} /></div>
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/admin/third-party/payment/${gw.id}/edit`} className="h-7 px-2.5 inline-flex items-center rounded-[5px] border border-line-2 bg-bg-2 text-fg-1 text-[11px] hover:bg-bg-3 transition-colors">{t("adminPayments.edit")}</Link>
                  </div>
                </div>

                {/* ── Mobile card ── */}
                <div className="sm:hidden px-4 py-3">
                  {/* Top: logo + name + badges */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-bg-3 border border-line flex items-center justify-center text-[10px] font-bold text-fg-1 shrink-0 overflow-hidden">
                        {logoSrc ? <GatewayLogo src={logoSrc} initials={initials} /> : initials}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[13px] font-semibold text-fg-0 leading-tight truncate">{title}</div>
                        <div className="text-[11px] text-fg-3 mono truncate">{gw.name}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 mt-0.5">
                      <span className={`inline-flex items-center h-5 px-2 rounded-full border text-[10px] font-medium tracking-wide uppercase ${typeBadgeCls(gw.type)}`}>{gw.type}</span>
                      <span className={`inline-flex items-center h-5 px-2 rounded-full border text-[10px] font-medium ${gw.mode === "live" ? "bg-[#10a37f]/10 text-[#10a37f] border-[#10a37f]/20" : "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20"}`}>{gw.mode}</span>
                    </div>
                  </div>

                  {/* Credentials */}
                  {totalCreds > 0 && (
                    <div className="flex items-center gap-1.5 mb-2 text-[11px]">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${filledCreds === totalCreds ? "bg-accent" : "bg-[#f59e0b]"}`} />
                      <span className="text-fg-2">{t("adminPayments.filled").replace("{filled}", String(filledCreds)).replace("{total}", String(totalCreds))}</span>
                      {filledCreds < totalCreds && <span className="text-[var(--danger)]">· {t("adminPayments.missing").replace("{n}", String(totalCreds - filledCreds))}</span>}
                    </div>
                  )}

                  {/* Action strip */}
                  <div className="flex items-center justify-between pt-2 border-t border-line">
                    <GatewayToggle id={gw.id} isActive={gw.isActive} />
                    <Link
                      href={`/admin/third-party/payment/${gw.id}/edit`}
                      className="h-8 px-3 inline-flex items-center rounded-[6px] border border-line-2 bg-bg-2 text-fg-1 text-[12px] font-medium hover:bg-bg-3 transition-colors"
                    >
                      {t("adminPayments.edit")}
                    </Link>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
